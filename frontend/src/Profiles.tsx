import { useEffect, useRef, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import { useApi } from "./lib/api";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";

interface UserSummary {
  id: number;
  display_name: string | null;
  bio: string | null;
  profile_background: string | null;
  picture_url: string | null;
}

const Profiles = () => {
  const api = useApi();
  const { isAuthenticated, isLoading } = useAuth0();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const LIMIT = 24;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  if (isLoading) return <Loading />;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-skrawl-black text-skrawl-white flex flex-col">
        <NavigationHeader />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-header font-header">Please sign in to browse profiles.</p>
        </div>
      </div>
    );
  }

  const loadPage = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const pageOffset = reset ? 0 : offset;
      const res = await api.browseUsers(appliedQuery, pageOffset, LIMIT);
      setResults((prev) => (reset ? res : [...prev, ...res]));
      setOffset(pageOffset + res.length);
      setHasMore(res.length === LIMIT);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setAppliedQuery("");
      setResults([]);
      setOffset(0);
      setHasMore(true);
      loadPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  // Apply search
  const search = async () => {
    const q = query.trim();
    setAppliedQuery(q);
    setResults([]);
    setOffset(0);
    setHasMore(true);
    await loadPage(true);
  };

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        loadPage();
      }
    });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasMore, loading, appliedQuery, offset]);

  return (
    <div className="min-h-screen bg-skrawl-black text-skrawl-white flex flex-col">
      <NavigationHeader />
      <div className="flex-grow mx-auto max-w-5xl w-full p-6 flex flex-col gap-8">
        <h1 className="text-logotype font-logotype">Profile Browser</h1>
        <section className="bg-skrawl-white/95 rounded-md p-4 text-skrawl-purple flex flex-col gap-3 border border-skrawl-purple/30">
          <h2 className="text-header font-header">Search Players</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search display name or bio"
              className="flex-1 px-3 py-2 rounded-md border border-skrawl-purple/40 focus:outline-none focus:ring-2 focus:ring-skrawl-magenta"
            />
            <button
              onClick={search}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta disabled:opacity-50"
            >
              Search
            </button>
          </div>
          {results.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {results.map((u) => (
                <div key={u.id} className="rounded border border-skrawl-purple/30 bg-white/80 p-3 flex flex-col gap-2">
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
                </div>
              ))}
              <div ref={sentinelRef} className="h-1" />
            </div>
          )}
          {loading && <div className="text-sm text-gray-500 mt-2">Loading…</div>}
          {!hasMore && results.length > 0 && <div className="text-xs text-gray-500 mt-2">End of results</div>}
        </section>
      </div>
    </div>
  );
};

export default Profiles;
