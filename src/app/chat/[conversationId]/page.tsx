"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import type { Message, ParticipantProfile } from "@/types";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";

const getMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  return Date.now();
};

const getParticipantIds = (conversationId: string, currentUserId: string) => {
  const parts = conversationId.split("_");
  if (parts.length >= 2) return [parts[0], parts[1]];
  return [currentUserId];
};

export default function ChatThreadPage() {
  const params = useParams<{ conversationId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const ideaId = searchParams.get("ideaId");
  const conversationId = params?.conversationId as string | undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [participants, setParticipants] = useState<Record<string, ParticipantProfile>>({});
  const [otherUser, setOtherUser] = useState<ParticipantProfile | null>(null);
  const [lastReadMap, setLastReadMap] = useState<Record<string, any>>({});
  
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const participantIds = useMemo(() => {
    if (!conversationId || !user?.uid) return null;
    return getParticipantIds(conversationId, user.uid);
  }, [conversationId, user?.uid]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 1. Initialize Conversation
  useEffect(() => {
    if (authLoading || !conversationId || !user || !participantIds) return;

    const db = getFirebaseDb();
    const convRef = doc(db, "conversations", conversationId);

    const initConversation = async () => {
      try {
        setLoadingConversation(true);
        setError(null);

        if (!participantIds.includes(user.uid)) {
          setError("You are not a participant in this conversation.");
          return;
        }

        await setDoc(convRef, {
            participants: participantIds,
            ideaId: ideaId ?? null,
            createdAt: serverTimestamp(),
          }, { merge: true }
        );

        const profileMap: Record<string, ParticipantProfile> = {};
        await Promise.all(
          participantIds.map(async (pid) => {
            const uref = doc(db, "users", pid);
            const usnap = await getDoc(uref);
            if (usnap.exists()) {
              const u = usnap.data() as any;
              profileMap[pid] = {
                id: pid,
                username: u.username ?? "User",
                handle: u.handle ?? "",
                photoURL: u.photoURL ?? null,
              };
            } else {
              profileMap[pid] = { id: pid, username: "User", handle: "", photoURL: null };
            }
          })
        );

        setParticipants(profileMap);
        const otherId = participantIds.find((p) => p !== user.uid) ?? user.uid;
        setOtherUser(profileMap[otherId] ?? null);
      } catch (err) {
        console.error("Init failed:", err);
        setError("Failed to load conversation.");
      } finally {
        setLoadingConversation(false);
      }
    };

    void initConversation();
  }, [conversationId, ideaId, user, participantIds, authLoading]);

  // 2. Fetch Messages
  useEffect(() => {
    if (authLoading || !conversationId) return;

    const db = getFirebaseDb();
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Message[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          conversationId,
          senderId: data.senderId,
          text: data.text,
          createdAt: getMillis(data.createdAt),
        });
      });
      setMessages(list);
    });

    return () => unsubscribe();
  }, [conversationId, authLoading]);

  // 3. Sync Read Status
  useEffect(() => {
    if (!conversationId || !user) return;

    const db = getFirebaseDb();
    const convRef = doc(db, "conversations", conversationId);

    const unsubscribe = onSnapshot(convRef, (docSnap) => {
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      
      if (data.lastReadAt) {
        setLastReadMap(data.lastReadAt);
      }

      const lastSender = data.lastMessageSenderId;
      const lastMsgTimeVal = data.lastMessageAt;
      const myReadTimeVal = data.lastReadAt?.[user.uid];

      if (lastSender && lastSender !== user.uid && lastMsgTimeVal) {
        const lastMsgMillis = getMillis(lastMsgTimeVal);
        const myReadMillis = getMillis(myReadTimeVal);

        if (myReadMillis < lastMsgMillis) {
          const readTimeWithBuffer = Timestamp.fromMillis(lastMsgMillis + 100);
          updateDoc(convRef, {
            [`lastReadAt.${user.uid}`]: readTimeWithBuffer
          }).catch(err => console.error("Read sync error", err));
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  const otherUserLastReadAt = useMemo(() => {
    if (!otherUser?.id || !lastReadMap) return null;
    const val = lastReadMap[otherUser.id];
    return getMillis(val);
  }, [otherUser, lastReadMap]);

  // 4. Handle Send & Trigger Email
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !conversationId || !text.trim() || sending) return;

      const messageText = text.trim();
      setText("");
      setSending(true);

      try {
        const db = getFirebaseDb();
        const now = serverTimestamp();

        // A. Add Message
        await addDoc(collection(db, "conversations", conversationId, "messages"), {
          senderId: user.uid,
          text: messageText,
          createdAt: now,
        });

        // B. Update Metadata
        await setDoc(
          doc(db, "conversations", conversationId),
          {
            participants: participantIds,
            lastMessageText: messageText,
            lastMessageAt: now,
            lastMessageSenderId: user.uid,
            [`lastReadAt.${user.uid}`]: now 
          },
          { merge: true }
        );
        
        // C. Trigger Notification API
        const recipientId = participantIds?.find(p => p !== user.uid);
        const senderProfile = participants[user.uid];
        const senderName = senderProfile?.username || "A user";
        
        if (recipientId) {
            console.log(`[UI] Sending notification to ${recipientId} via /api/emails/send-notification`);
            
            // CORRECTED URL TO MATCH YOUR FOLDER STRUCTURE
            fetch('/api/emails/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId,
                    senderName,
                    messageText,
                    conversationId
                })
            })
            .then(async (res) => {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                   return res.json();
                } else {
                   // If this throws, path is still wrong
                   const text = await res.text();
                   throw new Error(`API returned non-JSON (${res.status}): ${text.substring(0, 50)}...`);
                }
            })
            .then(data => {
                if(data.skipped) console.log("[UI] Email Debounced (Too frequent)");
                else console.log("[UI] Email Sent Successfully");
            })
            .catch(err => {
                console.error("[UI] Notification Failed:", err.message);
            });
        }

      } catch (err) {
        console.error("Send error:", err);
        setError("Message failed to send.");
        setText(messageText);
      } finally {
        setSending(false);
      }
    },
    [conversationId, user, text, participantIds, sending, participants]
  );

  const handleVisitProfile = () => {
    if (otherUser) router.push(`/profile/${otherUser.id}`);
  };

  if (authLoading || (loadingConversation && !otherUser)) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center sm:p-4">
      <div className="w-full h-full sm:h-[90vh] sm:max-w-4xl flex flex-col sm:rounded-2xl overflow-hidden bg-neutral-950 sm:border sm:border-neutral-800">
        
        <div className="flex-shrink-0 bg-neutral-900 border-b border-neutral-800 p-3 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 hover:bg-neutral-800 rounded-full text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <div className="flex items-center gap-2">
                {otherUser?.photoURL ? (
                    <img src={otherUser.photoURL} className="w-9 h-9 rounded-full object-cover" alt="" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold">{otherUser?.username?.[0]}</div>
                )}
                <div>
                   <h1 className="font-bold text-white text-sm sm:text-base">{otherUser?.username}</h1>
                   {otherUser?.handle && <p className="text-xs text-neutral-400">@{otherUser.handle}</p>}
                </div>
             </div>
           </div>
           <button onClick={handleVisitProfile} className="px-3 py-1.5 bg-neutral-800 rounded text-xs text-white">Profile</button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
           {error && <div className="text-center text-red-400 text-sm mb-2">{error}</div>}
           
           <MessageList 
             messages={messages} 
             participants={participants} 
             currentUserId={user.uid} 
             loading={loadingConversation} 
             error={error} 
             otherUserLastReadAt={otherUserLastReadAt ?? undefined}
           />
        </div>

        <div className="flex-shrink-0 border-t border-neutral-800 bg-neutral-950 p-3 pb-safe">
           <ChatInput 
             text={text} 
             setText={setText} 
             onSend={handleSend} 
             disabled={!text.trim() || sending} 
           />
        </div>
      </div>
    </div>
  );
}