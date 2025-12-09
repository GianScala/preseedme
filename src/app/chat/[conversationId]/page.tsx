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

  // Mobile-optimized body scroll prevention
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Better mobile handling
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.touchAction = "none"; // Prevent pull-to-refresh
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.body.style.touchAction = "";
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

  // 4. Sync Read Status
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

  // 5. Send Handler
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!user || !conversationId || !text.trim() || sending) return;

      const messageText = text.trim();
      const senderName = user.displayName || user.email?.split('@')[0] || "A Founder";

      setText("");
      setSending(true);
      isNearBottomRef.current = true;

      try {
        const db = getFirebaseDb();
        const now = serverTimestamp(); 

        await addDoc(collection(db, "conversations", conversationId, "messages"), {
          senderId: user.uid,
          text: messageText,
          createdAt: now,
        });

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

        if (otherUser?.id) {
          fetch('/api/emails/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: otherUser.id,
              senderName: senderName,
              messageText: messageText,
              conversationId: conversationId
            })
          }).catch(err => console.error("Notification error:", err));
        }

      } catch (err) {
        console.error("Send error:", err);
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
      <div className="flex flex-col items-center justify-center min-h-screen py-20">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-brand animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/95 backdrop-blur-sm">
      <div className="h-full w-full flex flex-col md:p-4 md:items-center md:justify-center">
        <div className="w-full h-full md:h-[90vh] md:max-w-4xl flex flex-col md:rounded-2xl overflow-hidden md:shadow-2xl bg-neutral-900 md:border md:border-neutral-800">
          {/* HEADER - Mobile optimized with safe-area support */}
          <div 
            className="flex-shrink-0 bg-neutral-900 border-b border-neutral-800 pt-safe"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
          >
            <div className="px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Close Button */}
                <button 
                  onClick={() => router.back()} 
                  className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors active:scale-95"
                  aria-label="Close chat"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* User Info */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {otherUser?.photoURL ? (
                    <img 
                      src={otherUser.photoURL} 
                      alt={otherUser.username} 
                      className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-neutral-700" 
                    />
                  ) : (
                    <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-sm sm:text-base">
                      {otherUser?.username?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-white truncate">
                      {otherUser?.username || "Chat"}
                    </h1>
                    {otherUser?.handle && (
                      <p className="text-xs sm:text-sm text-neutral-400 truncate">
                        @{otherUser.handle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Button */}
              <button 
                onClick={handleVisitProfile}
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white transition-all text-xs sm:text-sm font-medium"
              >
                <span className="hidden xs:inline">Visit</span>
                <span className="xs:hidden">Profile</span>
              </button>
            </div>
          </div>

          {/* MESSAGES - Better mobile scrolling */}
          <div 
            ref={scrollContainerRef} 
            onScroll={updateScrollPosition} 
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-xs sm:text-sm text-center">
                  {error}
                </div>
              )}
              <MessageList 
                messages={messages} 
                participants={participants} 
                currentUserId={user.uid} 
                loading={loadingConversation} 
                error={error} 
              />
              <div ref={messagesEndRef} className="h-px" />
            </div>
          </div>

          {/* INPUT - Fixed zoom issue with 16px minimum font size */}
          <div 
            className="flex-shrink-0 border-t border-neutral-800 bg-neutral-900 pb-safe"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
          >
            <div className="px-3 py-3 sm:px-4 sm:py-4">
              <ChatInput 
                text={text} 
                setText={setText} 
                onSend={handleSend} 
                disabled={!text.trim() || sending || !!error} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}