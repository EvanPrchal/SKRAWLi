import { useEffect, useRef, useState } from "react";
import { useApi } from "../lib/api";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";

// Reuses logic from Friends.tsx but tailored for tab environment

interface UserSummary {
  id: number;
  display_name: string | null;
  bio: string | null;
  profile_background: string | null;
  picture_url: string | null;
  showcased_badges: string | null;
}
interface FriendRequest {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: string;
  created_at: string;
  responded_at: string | null;
}

const LIMIT = 24;

const ProfileFriendsTab: React.FC = () => {
  const api = useApi();
  const { isAuthenticated, isLoading } = useAuth0();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [inbound, setInbound] = useState<FriendRequest[]>([]);
  const [outbound, setOutbound] = useState<FriendRequest[]>([]);
  const [browseQuery, setBrowseQuery] = useState<string>("");
  const [browseResults, setBrowseResults] = useState<UserSummary[]>([]);
  const [appliedQuery, setAppliedQuery] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingBrowse, setLoadingBrowse] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const [f, r] = await Promise.all([api.listFriends(), api.listFriendRequests()]);
      setFriends(f);
      setInbound(r.inbound);
      setOutbound(r.outbound);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      refresh();
    }
  }, [isLoading, isAuthenticated]);

  const loadPage = async (reset = false) => {
    if (loadingBrowse) return;
    setLoadingBrowse(true);
    try {
      const pageOffset = reset ? 0 : offset;
      const res = await api.browseUsers(appliedQuery, pageOffset, LIMIT);
      setBrowseResults((prev) => (reset ? res : [...prev, ...res]));
      setOffset(pageOffset + res.length);
      setHasMore(res.length === LIMIT);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBrowse(false);
    }
  };

  const handleSearch = async () => {
    const q = browseQuery.trim();
    setAppliedQuery(q);
    setBrowseResults([]);
    setOffset(0);
    setHasMore(true);
    await loadPage(true);
  };

  // Initial browse load
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setAppliedQuery("");
      setBrowseResults([]);
      setOffset(0);
      setHasMore(true);
      loadPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loadingBrowse) {
        loadPage();
      }
    });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasMore, loadingBrowse, appliedQuery, offset]);

  const sendRequest = async (id: number) => {
    setBusy(true);
    try {
      await api.sendFriendRequest(id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const accept = async (req: FriendRequest) => {
    setBusy(true);
    try {
      await api.acceptFriendRequest(req.id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const decline = async (req: FriendRequest) => {
    setBusy(true);
    try {
      await api.declineFriendRequest(req.id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const removeFriend = async (id: number) => {
    setBusy(true);
    try {
      await api.removeFriend(id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <div className="text-sm text-skrawl-purple">Sign in required.</div>;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Browse/Search */}
      <section className="bg-skrawl-white/95 rounded-md p-4 text-skrawl-purple flex flex-col gap-4 border border-skrawl-purple/30">
        <div className="flex items-center justify-between">
          <h2 className="text-header font-header">Players</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={browseQuery}
            onChange={(e) => setBrowseQuery(e.target.value)}
            placeholder="Search display name or bio"
            className="flex-1 px-3 py-2 rounded-md border border-skrawl-purple/40 focus:outline-none focus:ring-2 focus:ring-skrawl-magenta"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
            disabled={busy}
          >
            Search
          </button>
          <button
            onClick={() => {
              setBrowseQuery("");
              setAppliedQuery("");
              setBrowseResults([]);
              setOffset(0);
              setHasMore(true);
              loadPage(true);
            }}
            className="px-4 py-2 rounded-md bg-gray-300 text-skrawl-purple hover:bg-gray-400 disabled:opacity-50"
            disabled={busy}
          >
            Clear
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {browseResults.map((u) => {
            const alreadyFriend = friends.some((fr) => fr.id === u.id);
            return (
              <div
                key={u.id}
                className="rounded border border-skrawl-purple/30 bg-white/80 p-3 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  navigate(`/users/${u.id}`);
                }}
              >
                <div className="flex items-center gap-3">
                  {u.picture_url ? (
                    <img
                      src={u.picture_url}
                      alt={u.display_name || `User ${u.id}`}
                      className="w-10 h-10 rounded-full border border-skrawl-purple/40 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-skrawl-purple/20 border border-skrawl-purple/40 flex items-center justify-center text-skrawl-purple font-header">
                      {(u.display_name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="text-header font-header">{u.display_name || `User #${u.id}`}</div>
                  </div>
                </div>
                <p className="text-sm font-body line-clamp-3">{u.bio || "No bio"}</p>
                {alreadyFriend ? (
                  <div className="px-3 py-1 rounded-md bg-skrawl-purple/10 text-skrawl-purple text-sm font-header border border-skrawl-purple/30 text-center select-none">
                    Friends
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendRequest(u.id);
                    }}
                    disabled={busy}
                    className="px-3 py-1 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            );
          })}
          <div ref={sentinelRef} className="h-1 col-span-full" />
        </div>
        {!loadingBrowse && browseResults.length === 0 && <div className="text-sm text-gray-500">No other players yet.</div>}
        {loadingBrowse && <div className="text-sm text-gray-500">Loading…</div>}
        {!hasMore && browseResults.length > 0 && <div className="text-xs text-gray-500">End of results</div>}
      </section>

      {/* Requests */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-skrawl-white/95 rounded-md p-4 text-skrawl-purple flex flex-col gap-3 border border-skrawl-purple/30">
          <h2 className="text-header font-header">Inbound Requests</h2>
          {inbound.length === 0 && <p className="text-sm">No inbound requests</p>}
          {inbound.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-skrawl-purple/30 bg-white/80 px-3 py-2">
              <span className="text-body font-body">Request from User #{r.requester_id}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => accept(r)}
                  disabled={busy}
                  className="px-3 py-1 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta"
                >
                  Accept
                </button>
                <button onClick={() => decline(r)} disabled={busy} className="px-3 py-1 rounded-md bg-gray-300 text-skrawl-purple hover:bg-gray-400">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-skrawl-white/95 rounded-md p-4 text-skrawl-purple flex flex-col gap-3 border border-skrawl-purple/30">
          <h2 className="text-header font-header">Outbound Requests</h2>
          {outbound.length === 0 && <p className="text-sm">No outbound requests</p>}
          {outbound.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-skrawl-purple/30 bg-white/80 px-3 py-2">
              <span className="text-body font-body">To User #{r.receiver_id} (pending)</span>
            </div>
          ))}
        </div>
      </section>

      {/* Friends List */}
      <section className="bg-skrawl-white/95 rounded-md p-4 text-skrawl-purple flex flex-col gap-3 border border-skrawl-purple/30">
        <h2 className="text-header font-header">Your Friends</h2>
        {friends.length === 0 && <p className="text-sm">You have no friends yet.</p>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((f) => (
            <div key={f.id} className="rounded border border-skrawl-purple/30 bg-white/80 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {f.picture_url ? (
                  <img
                    src={f.picture_url}
                    alt={f.display_name || `User ${f.id}`}
                    className="w-10 h-10 rounded-full border border-skrawl-purple/40 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-skrawl-purple/20 border border-skrawl-purple/40 flex items-center justify-center text-skrawl-purple font-header">
                    {(f.display_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-header font-header">{f.display_name || `User #${f.id}`}</div>
                </div>
              </div>
              <p className="text-sm font-body line-clamp-3">{f.bio || "No bio"}</p>
              <button
                onClick={() => removeFriend(f.id)}
                disabled={busy}
                className="px-3 py-1 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProfileFriendsTab;
