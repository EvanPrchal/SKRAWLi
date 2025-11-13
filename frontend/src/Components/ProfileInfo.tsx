import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useApi } from "../lib/api";

export type ProfileBadges = {
  badgeOne: string;
  badgeTwo: string;
  badgeThree: string;
  badgeFour: string;
  badgeFive: string;
};

interface BadgeProps {
  badges: ProfileBadges;
  profileBackground: string;
  onBackgroundChange: (bg: string) => void;
}

const BACKGROUND_OPTIONS = [
  { name: "Cyan", value: "bg-skrawl-cyan" },
  { name: "Magenta", value: "bg-skrawl-magenta" },
  { name: "Orange", value: "bg-skrawl-orange" },
];

const ProfileInfo: React.FC<BadgeProps> = ({ badges, profileBackground, onBackgroundChange }) => {
  const { user, isLoading } = useAuth0();
  const api = useApi();
  const badgeUrls = Object.values(badges);
  const [bio, setBio] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Temporary state for editing
  const [editBio, setEditBio] = useState<string>("");
  const [editDisplayName, setEditDisplayName] = useState<string>("");
  const [editProfileBackground, setEditProfileBackground] = useState<string>("");

  useEffect(() => {
    if (!isLoading) {
      Promise.all([
        api
          .getBio()
          .then((data) => setBio(data.bio || ""))
          .catch((err) => console.error("Failed to load bio:", err)),
        api
          .getDisplayName()
          .then((data) => setDisplayName(data.display_name || user?.name || ""))
          .catch((err) => console.error("Failed to load display name:", err)),
      ]);
    }
  }, [isLoading]);

  const handleEdit = () => {
    setEditDisplayName(displayName);
    setEditBio(bio);
    setEditProfileBackground(profileBackground);
    setIsEditing(true);
  };

  const handleBackgroundSelect = (bg: string) => {
    setEditProfileBackground(bg);
    onBackgroundChange(bg); // Preview immediately
  };

  const handleSave = async () => {
    if (editDisplayName.trim().length === 0) {
      alert("Display name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all([api.updateDisplayName(editDisplayName), api.updateBio(editBio), api.updateProfileBackground(editProfileBackground)]);
      setDisplayName(editDisplayName);
      setBio(editBio);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditDisplayName(displayName);
    setEditBio(bio);
    onBackgroundChange(profileBackground); // Revert preview
    setEditProfileBackground(profileBackground);
    setIsEditing(false);
  };

  return (
    <div className="text-center flex justify-around w-full gap-8">
      <section className="flex flex-col justify-center items-center space-y-4">
        <img className="border-dotted border-3 p-3" src={user?.picture} alt={user?.name} />

        {isEditing ? (
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-body text-skrawl-purple text-left">Display Name</label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Enter display name..."
                className="text-body font-body text-skrawl-purple border border-skrawl-purple rounded p-2"
              />
              <span className="text-xs text-gray-500 text-right">{editDisplayName.length}/50</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-body text-skrawl-purple text-left">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={500}
                placeholder="Tell us about yourself..."
                className="text-body font-body text-skrawl-black border border-skrawl-purple rounded p-2 resize-none"
                rows={4}
              />
              <span className="text-xs text-gray-500 text-right">{editBio.length}/500</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-body text-skrawl-purple text-left">Background Color</label>
              <div className="flex flex-wrap gap-3 justify-center">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleBackgroundSelect(option.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded border-2 transition-all ${
                      editProfileBackground === option.value ? "border-skrawl-purple scale-110" : "border-gray-300 hover:border-skrawl-cyan"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded ${option.value} border border-gray-400`} />
                    <span className="text-xs text-skrawl-black">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-skrawl-purple text-white rounded hover:bg-skrawl-magenta transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <h2 className="text-header font-body text-skrawl-purple">{displayName || user?.name || "Username"}</h2>
            <h2 className="text-body font-body text-skrawl-black max-w-md">{bio || "No bio yet."}</h2>
            <button onClick={handleEdit} className="px-4 py-2 bg-skrawl-cyan text-white rounded hover:bg-skrawl-purple transition-colors">
              Edit Profile
            </button>
          </div>
        )}
      </section>
      <section className="flex flex-col items-center justify-center space-y-6">
        <h2 className="text-header font-body underline text-skrawl-purple">Badges</h2>
        <div className="flex gap-6 flex-wrap justify-around w-full max-w-md">
          {badgeUrls.map((url, idx) => (
            <img key={idx} src={url} alt={`Badge ${idx + 1}`} className="w-16 h-16 rounded-full shadow-md" />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProfileInfo;
