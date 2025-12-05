import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavigationHeader from "./Components/NavigationHeader";
import Loading from "./Components/Loading";
import { useApi } from "./lib/api";
import { useAuth0 } from "@auth0/auth0-react";

// Removed BadgeInfo and earned badges list for external profiles

const UserProfile = () => {
  const { id } = useParams();
  const userId = Number(id);
  const api = useApi();
  const { isAuthenticated, isLoading } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<null | {
    id: number;
    display_name: string | null;
    bio: string | null;
    profile_background: string | null;
    showcased_badges: string | null;
    picture_url: string | null;
  }>(null);
  const [friends, setFriends] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, f] = await Promise.all([api.getUserProfile(userId), api.listFriends()]);
      setProfile(p);
      setFriends(f.map((x) => x.id));
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && !Number.isNaN(userId)) {
      load();
    }
  }, [isLoading, isAuthenticated, userId]);

  const isFriend = friends.includes(userId);

  const sendRequest = async () => {
    setBusy(true);
    try {
      await api.sendFriendRequest(userId);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const removeFriend = async () => {
    setBusy(true);
    try {
      await api.removeFriend(userId);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || loading) return <Loading />;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-skrawl-purple text-skrawl-white flex flex-col">
        <NavigationHeader />
        <div className="flex-grow flex items-center justify-center">Sign in required.</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-skrawl-purple text-skrawl-white flex flex-col">
        <NavigationHeader />
        <div className="flex-grow flex items-center justify-center">{error}</div>
      </div>
    );
  }
  if (!profile) return null;

  const showcased = (profile.showcased_badges || "")
    .split(/[,\s]+/)
    .filter((b) => b.trim().length > 0)
    .slice(0, 3);

  const normalizeBackground = (value?: string | null) => {
    if (!value) return "bg-skrawl-purple";
    return value === "bg-skrawl-black" ? "bg-skrawl-purple" : value;
  };

  const bg = normalizeBackground(profile.profile_background);
  const isHex = bg.startsWith("#");
  const bgClass = isHex ? "" : bg;
  const bgStyle = isHex ? { backgroundColor: bg } : {};

  return (
    <div className={`flex flex-col min-h-screen ${bgClass} bg-[url(/src/assets/images/background.png)] bg-cover`} style={bgStyle}>
      <NavigationHeader />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-skrawl-white rounded-lg overflow-hidden border border-skrawl-purple/30">
          <div className="flex justify-between items-center px-6 py-4 bg-skrawl-purple text-skrawl-white">
            <h1 className="text-header font-header">{profile.display_name || `User #${profile.id}`}</h1>
            <div className="flex gap-3">
              {isFriend ? (
                <button
                  onClick={removeFriend}
                  disabled={busy}
                  className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
                >
                  Remove Friend
                </button>
              ) : (
                <button
                  onClick={sendRequest}
                  disabled={busy}
                  className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
                >
                  Add Friend
                </button>
              )}
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-8 flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-4">
              {profile.picture_url ? (
                <img
                  src={profile.picture_url}
                  alt={profile.display_name || `User ${profile.id}`}
                  className="w-40 h-40 rounded-full border-2 border-skrawl-purple/40 object-cover shadow-md"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-skrawl-purple/20 border-2 border-skrawl-purple/40 flex items-center justify-center text-skrawl-purple font-header text-5xl shadow-md">
                  {(profile.display_name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-sm text-skrawl-purple font-body opacity-70">User ID: {profile.id}</div>
            </div>
            <div className="max-w-2xl w-full flex flex-col items-center gap-4">
              <h2 className="text-header font-header text-skrawl-purple">Bio</h2>
              <p className="text-sm font-body text-skrawl-purple whitespace-pre-wrap w-full text-center">{profile.bio || "No bio provided."}</p>
            </div>
            <div className="max-w-2xl w-full flex flex-col items-center gap-6">
              <h2 className="text-header font-header text-skrawl-purple">Showcased Badges</h2>
              {showcased.length === 0 && <p className="text-xs font-body">None</p>}
              <div className="flex flex-wrap justify-center gap-6">
                {showcased.map((code) => (
                  <div
                    key={code}
                    className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-skrawl-purple bg-skrawl-purple/10 shadow-md"
                    title={code}
                  >
                    <span className="text-3xl" role="img" aria-label="badge">
                      🏆
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
