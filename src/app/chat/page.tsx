"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

interface FirestoreConversation {
  participants: string[];
  ideaId?: string | null;
  lastMessageText?: string;
  lastMessageAt?: Timestamp;
  lastMessageSenderId?: string;
  lastReadAt?: Record<string, Timestamp>;
}

interface PeerUser {
  id: string;
  username: string;
  handle: string;
  photoURL?: string | null;
}

export interface ConversationWithPeer {
  id: string;
  participants: string[];
  lastMessageText: string;
  lastMessageAt: number;
  lastMessageSenderId?: string;
  lastReadAt: Record<string, number>;
  peer?: PeerUser;
}

function formatTime(timestampMs?: number) {
  if (!timestampMs) return "";
  const date = new Date(timestampMs);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = (today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ConversationAvatar({
  peer,
  hasUnread,
}: {
  peer?: PeerUser;
  hasUnread: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const avatarInitial = peer?.username?.[0]?.toUpperCase() || "U";
  const shouldShowInitials = !peer?.photoURL || imageError;

  if (shouldShowInitials) {
    return (
      <div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-black flex-shrink-0 shadow-sm ${
          hasUnread
            ? "bg-gradient-to-br from-brand to-brand-dark ring-2 ring-brand/30"
            : "bg-gradient-to-br from-neutral-700 to-neutral-800"
        }`}
      >
        {avatarInitial}
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      <img
        src={peer!.photoURL!}
        alt={`${peer!.username}'s profile`}
        className={`w-12 h-12 rounded-full object-cover shadow-sm ${
          hasUnread ? "ring-2 ring-brand/50" : "ring-1 ring-neutral-800"
        }`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
      {hasUnread && (
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand border-2 border-neutral-950 shadow-sm" />
      )}
    </div>
  );
}

export default function ChatInboxPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoBox, setShowInfoBox] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    const convRef = collection(db, "conversations");
    const q = query(
      convRef,
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      async (snap) => {
        const rawDocs = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          data: docSnap.data({ serverTimestamps: "estimate" }) as FirestoreConversation,
        }));

        const processedConvs = await Promise.all(
          rawDocs.map(async ({ id, data }) => {
            const conv: ConversationWithPeer = {
              id,
              participants: data.participants ?? [],
              lastMessageText: data.lastMessageText ?? "",
              lastMessageAt: data.lastMessageAt?.toMillis?.() ?? 0,
              lastMessageSenderId: data.lastMessageSenderId,
              lastReadAt: {},
            };

            if (data.lastReadAt) {
              Object.entries(data.lastReadAt).forEach(([uid, ts]) => {
                conv.lastReadAt[uid] = ts?.toMillis?.() ?? 0;
              });
            }

            const peerId = conv.participants.find((p) => p !== user.uid);
            if (peerId) {
              try {
                const userRef = doc(db, "users", peerId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const u = userSnap.data() as DocumentData;
                  conv.peer = {
                    id: peerId,
                    username: u.username ?? "User",
                    handle: u.handle ?? "",
                    photoURL: u.photoURL ?? null,
                  };
                }
              } catch (error) {
                console.error(`Failed to fetch peer ${peerId}`, error);
              }
            }
            return conv;
          })
        );

        setConversations(processedConvs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, authLoading]);

  const unreadIds = useMemo(() => {
    if (!user) return new Set<string>();
    const ids = new Set<string>();
    
    conversations.forEach((c) => {
      if (!c.lastMessageAt || !c.lastMessageSenderId) return;
      if (c.lastMessageSenderId === user.uid) return;

      const lastReadTime = c.lastReadAt?.[user.uid] ?? 0;
      
      // Because the thread page now adds a buffer (+100ms), 
      // lastReadTime will DEFINITELY be > lastMessageAt when read.
      if (lastReadTime === 0 || lastReadTime < c.lastMessageAt) {
        ids.add(c.id);
      }
    });
    return ids;
  }, [conversations, user]);

  const unreadCount = unreadIds.size;

  if (authLoading || (loading && !conversations.length)) {
    return (
      <div className="flex items-center justify-center py-24 min-h-[50vh]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-800" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
          <span className="text-sm text-neutral-400 font-medium animate-pulse">
            Loading inbox...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 min-h-[60vh]">
        <div className="p-4 rounded-full bg-neutral-900 border border-neutral-800">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Access Required</h2>
        <p className="text-neutral-400 max-w-xs text-center">Sign in to view your messages and connect with other founders.</p>
        <button
          onClick={() => router.push("/auth?next=/chat")}
          className="px-8 py-2.5 rounded-xl bg-brand text-black font-bold hover:bg-brand-light transition-all active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-4 px-1">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Inbox</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Connect with founders and <span className="text-brand font-semibold">collaborate</span>
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="mb-1 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-bold animate-in fade-in zoom-in">
              {unreadCount} new
            </span>
          )}
        </div>

        {showInfoBox && (
          <div className="relative flex items-start gap-3 py-4 px-2 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-in fade-in slide-in-from-top-2">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 pr-4">
              <p className="text-xs text-blue-300 leading-relaxed">
                Use this space to discuss details, negotiate terms, or ask specific questions about ideas.
              </p>
            </div>
            <button
              onClick={() => setShowInfoBox(false)}
              className="absolute top-2 right-2 p-1.5 text-blue-400/50 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </header>

      <div className="space-y-4">
        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-neutral-800 rounded-2xl bg-neutral-900/20 border-dashed text-center">
             <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-800 shadow-inner">
               <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-200">No conversations yet</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-sm">
              Browse the feed and message a founder to start your first conversation.
            </p>
            <button
              onClick={() => router.push("/ideas")}
              className="mt-6 px-6 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-200 text-sm font-semibold hover:bg-neutral-700 hover:border-neutral-600 transition-all hover:-translate-y-0.5"
            >
              Browse Ideas
            </button>
          </div>
        )}

        {conversations.length > 0 && (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const hasUnread = unreadIds.has(conv.id);
              const peer = conv.peer;
              const lastFromYou = conv.lastMessageSenderId === user.uid;
              const senderLabel = lastFromYou ? "You" : peer?.username ?? "User";
              const displayText = conv.lastMessageText || "No messages yet";

              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/chat/${conv.id}`)}
                  className={`group w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    hasUnread
                      ? "border-brand/40 bg-brand/5 hover:bg-brand/10 shadow-[0_0_15px_rgba(var(--brand-rgb),0.1)]"
                      : "border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/60 hover:border-neutral-700"
                  }`}
                >
                  <ConversationAvatar peer={peer} hasUnread={hasUnread} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`text-base font-bold truncate ${
                            hasUnread ? "text-white" : "text-neutral-300 group-hover:text-white"
                          }`}
                        >
                          {peer?.username ?? "User"}
                        </span>
                        {peer?.handle && (
                          <span className="text-xs sm:text-sm text-neutral-500 truncate group-hover:text-neutral-400 transition-colors">
                            @{peer.handle}
                          </span>
                        )}
                      </div>
                      {conv.lastMessageAt > 0 && (
                        <span className={`text-xs shrink-0 tabular-nums font-medium ${hasUnread ? "text-brand" : "text-neutral-500"}`}>
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm truncate flex-1 leading-relaxed ${
                          hasUnread
                            ? "text-neutral-200 font-medium"
                            : "text-neutral-400 group-hover:text-neutral-300"
                        }`}
                      >
                        <span className="text-neutral-500 font-normal mr-1">{senderLabel}:</span>
                        {displayText}
                      </p>
                      {hasUnread && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand shrink-0 shadow-[0_0_8px_rgba(var(--brand-rgb),0.6)] animate-pulse" />
                      )}
                    </div>
                  </div>
                  <svg
                    className={`hidden sm:block w-5 h-5 text-neutral-600 transition-transform group-hover:translate-x-1 ${hasUnread ? "text-brand/50" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}