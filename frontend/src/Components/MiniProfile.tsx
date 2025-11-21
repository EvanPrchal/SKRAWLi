import React from "react";

export interface MiniProfileData {
  id: number;
  display_name: string | null;
  bio: string | null;
  profile_background: string | null;
  showcased_badges: string | null;
  picture_url: string | null;
}

interface MiniProfileProps {
  profile: MiniProfileData | null;
  loading: boolean;
  error: string | null;
  isFriend: boolean;
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  onClose: () => void;
}

const MiniProfile: React.FC<MiniProfileProps> = ({ profile, loading, error, isFriend, onAddFriend, onRemoveFriend, onClose }) => {
  const showcased = (profile?.showcased_badges || "")
    .split(/[,\s]+/)
    .filter((b) => b.trim().length > 0)
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-skrawl-white border-l border-skrawl-purple/30">
      <div className="flex items-center justify-between px-4 py-3 border-b border-skrawl-purple/30 bg-skrawl-black text-skrawl-white">
        <h2 className="text-header font-header">{profile?.display_name || (profile ? `User #${profile.id}` : "Profile")}</h2>
        <button onClick={onClose} className="text-sm px-3 py-1 rounded bg-gray-300 text-skrawl-purple hover:bg-gray-400">
          Close
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 text-skrawl-purple flex flex-col gap-6">
        {loading && <div className="text-sm">Loading profile…</div>}
        {!loading && error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && profile && (
          <>
            <div className="flex items-center gap-4">
              {profile.picture_url ? (
                <img
                  src={profile.picture_url}
                  alt={profile.display_name || `User ${profile.id}`}
                  className="w-20 h-20 rounded-full border border-skrawl-purple/40 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-skrawl-purple/20 border border-skrawl-purple/40 flex items-center justify-center text-skrawl-purple font-header text-2xl">
                  {(profile.display_name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-body font-body text-sm">ID: {profile.id}</span>
                {profile.profile_background && <span className="text-xs font-body opacity-70">Background: {profile.profile_background}</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-header mb-1">Bio</h3>
              <p className="text-sm font-body whitespace-pre-wrap max-h-48 overflow-y-auto">{profile.bio || "No bio provided."}</p>
            </div>
            <div>
              <h3 className="text-sm font-header mb-2">Showcased Badges</h3>
              {showcased.length === 0 && <p className="text-xs font-body">None</p>}
              <div className="flex flex-wrap gap-2">
                {showcased.map((b) => (
                  <span key={b} className="px-2 py-1 rounded-md bg-skrawl-purple/10 text-skrawl-purple text-xs border border-skrawl-purple/30">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              {isFriend ? (
                <button onClick={onRemoveFriend} className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta">
                  Remove Friend
                </button>
              ) : (
                <button onClick={onAddFriend} className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta">
                  Add Friend
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MiniProfile;
