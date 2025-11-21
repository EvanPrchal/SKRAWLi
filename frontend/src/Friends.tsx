import { useEffect, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import { useApi } from "./lib/api";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";

type UserSummary = { id: number; display_name: string | null; bio: string | null; profile_background: string | null };
type FriendRequest = { id: number; requester_id: number; receiver_id: number; status: string; created_at: string; responded_at: string | null };

const Friends = () => {
  const api = useApi();
  const { isAuthenticated, isLoading, user } = useAuth0();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [inbound, setInbound] = useState<FriendRequest[]>([]);
  const [outbound, setOutbound] = useState<FriendRequest[]>([]);
  const [browseQuery, setBrowseQuery] = useState<string>("");
  const [browseResults, setBrowseResults] = useState<UserSummary[]>([]);
  const [busy, setBusy] = useState<boolean>(false);

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

  const handleSearch = async () => {
    if (!browseQuery.trim()) {
      setBrowseResults([]);
      return;
    }
    try {
      const res = await api.browseUsers(browseQuery.trim());
      setBrowseResults(res);
    } catch (e) {
      console.error(e);
    }
  };

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
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-skrawl-black text-skrawl-white flex flex-col">
        <NavigationHeader />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-header font-header">Please sign in to view friends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-skrawl-black bg-[url('/src/assets/images/background.png')] bg-cover text-skrawl-white flex flex-col">
      <NavigationHeader />
      <div className="flex-grow mx-auto max-w-6xl w-full p-6 flex flex-col gap-8">
        <h1 className="text-logotype font-logotype">Friends</h1>
        {/* Search / Browse */}
        <section className="bg-skrawl-white/95 rounded-md p-4 text-skrawl-purple flex flex-col gap-3 border border-skrawl-purple/30">
          <h2 className="text-header font-header">Find Players</h2>
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
          </div>
          {browseResults.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {browseResults.map((u) => (
                <div key={u.id} className="rounded border border-skrawl-purple/30 bg-white/80 p-3 flex flex-col gap-2">
                  <div className="text-header font-header">{u.display_name || `User #${u.id}`}</div>
                  <p className="text-sm font-body line-clamp-3">{u.bio || "No bio"}</p>
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={busy}
                    className="px-3 py-1 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Requests */}
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
                  <button
                    onClick={() => decline(r)}
                    disabled={busy}
                    className="px-3 py-1 rounded-md bg-gray-300 text-skrawl-purple hover:bg-gray-400"
                  >
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
                <div className="text-header font-header">{f.display_name || `User #${f.id}`}</div>
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
    </div>
  );
};

export default Friends;
