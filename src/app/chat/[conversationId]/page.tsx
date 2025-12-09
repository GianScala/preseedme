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
  Timestamp,
} from "firebase/firestore";
import type { Message, ParticipantProfile } from "@/types";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";

// HELPER: Safely convert timestamps
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
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  const participantIds = useMemo(() => {
    if (!conversationId || !user?.uid) return null;
    return getParticipantIds(conversationId, user.uid);
  }, [conversationId, user?.uid]);

  // Prevent body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = "";
    };
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
      }
    });
  }, []);

  const updateScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const bottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = bottom < 150;
  }, []);

  // 1. Initialize Conversation
  useEffect(() => {
    if (authLoading || !conversationId || !user || !participantIds) return;

    const db = getFirebaseDb();
    const convRef = doc(db, "conversations", conversationId);
    let cancelled = false;

    const initConversation = async () => {
      try {
        setLoadingConversation(true);
        setError(null);

        if (!participantIds.includes(user.uid)) {
          setError("You are not a participant in this conversation.");
          return;
        }

        await setDoc(
          convRef,
          {
            participants: participantIds,
            ideaId: ideaId ?? null,
            createdAt: serverTimestamp(),
          },
          { merge: true }
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

        if (cancelled) return;
        setParticipants(profileMap);

        const otherId = participantIds.find((p) => p !== user.uid) ?? user.uid;
        // DEBUG: Check if we actually found the other user
        console.log("[INIT] Found other user:", otherId, profileMap[otherId]);
        setOtherUser(profileMap[otherId] ?? null);
      } catch (err) {
        console.error("Init failed:", err);
        setError("Failed to load conversation.");
      } finally {
        if (!cancelled) setLoadingConversation(false);
      }
    };

    void initConversation();
    return () => { cancelled = true; };
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

  // 3. Scroll Handling
  useEffect(() => {
    if (messages.length === 0) return;
    const isNewMessage = messages.length > prevMessageCountRef.current;
    const isFirstLoad = prevMessageCountRef.current === 0;
    prevMessageCountRef.current = messages.length;

    if (isFirstLoad) {
      scrollToBottom("auto");
    } else if (isNewMessage && isNearBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  // =================================================================
  //  SYNC READ STATUS
  // =================================================================
  useEffect(() => {
    if (!conversationId || !user) return;

    const db = getFirebaseDb();
    const convRef = doc(db, "conversations", conversationId);

    const unsubscribe = onSnapshot(convRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const lastMsgTimeVal = data.lastMessageAt;
      const lastSender = data.lastMessageSenderId;
      const myReadTimeVal = data.lastReadAt?.[user.uid];

      if (lastSender && lastSender !== user.uid && lastMsgTimeVal) {
        const lastMsgMillis = getMillis(lastMsgTimeVal);
        const myReadMillis = getMillis(myReadTimeVal);

        if (myReadMillis < lastMsgMillis) {
          // console.log("[SYNC-READ] Marking as read..."); // Commented out to reduce noise
          setDoc(
            convRef, 
            { [`lastReadAt.${user.uid}`]: lastMsgTimeVal }, 
            { merge: true }
          ).catch(err => console.error("Failed to sync read status:", err));
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  // 4. SEND HANDLER WITH DEBUG CHECKPOINTS
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!user || !conversationId || !text.trim() || sending) return;

      console.log("📍 CHECKPOINT 1: Send started");

      const messageText = text.trim();
      const senderName = user.displayName || user.email?.split('@')[0] || "A Founder";

      setText("");
      setSending(true);
      isNearBottomRef.current = true;

      try {
        const db = getFirebaseDb();
        const now = serverTimestamp(); 

        // Save Message
        await addDoc(collection(db, "conversations", conversationId, "messages"), {
          senderId: user.uid,
          text: messageText,
          createdAt: now,
        });
        
        console.log("📍 CHECKPOINT 2: Message saved to Firestore");

        // Update Conversation
        await setDoc(
          doc(db, "conversations", conversationId),
          {
            participants: participantIds,
            lastMessageText: messageText,
            lastMessageAt: now,
            lastMessageSenderId: user.uid,
            [`lastReadAt.${user.uid}`]: now,
          },
          { merge: true }
        );

        console.log("📍 CHECKPOINT 3: Conversation metadata updated");

        // Notify
        if (otherUser?.id) {
          console.log("📍 CHECKPOINT 4: Sending Notification to:", otherUser.id);
          
          fetch('/api/emails/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: otherUser.id,
              senderName: senderName,
              messageText: messageText,
              conversationId: conversationId
            })
          })
          .then(async (res) => {
            const data = await res.json();
            console.log("📍 CHECKPOINT 5: Notification API Response:", data);
          })
          .catch(err => console.error("❌ CHECKPOINT FAIL: Fetch error:", err));
        } else {
          console.warn("⚠️ CHECKPOINT FAIL: 'otherUser' is null or missing ID. Notification skipped.", otherUser);
        }

      } catch (err) {
        console.error("❌ Critical Send Error:", err);
        setError("Message failed to send.");
        setText(messageText);
      } finally {
        setSending(false);
      }
    },
    [conversationId, user, text, participantIds, sending, otherUser]
  );

  const handleVisitProfile = useCallback(() => {
    if (!otherUser) return;
    router.push(`/profile/${otherUser.id}`);
  }, [otherUser, router]);

  if (authLoading || (loadingConversation && !otherUser)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-brand animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-neutral-900/20 border border-neutral-800">
        {/* HEADER */}
        <div className="flex-shrink-0 bg-neutral-900/20 border-b border-neutral-800 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => router.back()} className="flex-shrink-0 p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {otherUser?.photoURL ? (
                <img src={otherUser.photoURL} alt={otherUser.username} className="flex-shrink-0 w-10 h-10 rounded-full object-cover border border-neutral-700" />
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white">
                  {otherUser?.username?.[0] || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{otherUser?.username || "Chat"}</h1>
                {otherUser?.handle && <p className="text-sm text-neutral-400 truncate">@{otherUser.handle}</p>}
              </div>
            </div>
          </div>
          <button onClick={handleVisitProfile} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors">
            <span className="hidden sm:inline text-sm font-medium">Visit Profile</span>
          </button>
        </div>

        {/* MESSAGES */}
        <div ref={scrollContainerRef} onScroll={updateScrollPosition} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="p-4 space-y-4">
            {error && <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm text-center">{error}</div>}
            <MessageList messages={messages} participants={participants} currentUserId={user.uid} loading={loadingConversation} error={error} />
            <div ref={messagesEndRef} className="h-px" />
          </div>
        </div>

        {/* INPUT */}
        <div className="flex-shrink-0 border-t border-neutral-800 bg-neutral-900 p-4">
          <ChatInput text={text} setText={setText} onSend={handleSend} disabled={!text.trim() || sending || !!error} />
        </div>
      </div>
    </div>
  );
}