import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  FolderPlus,
  ImageIcon,
  Loader2,
  Trash2,
  Download,
  Grid3X3,
  List,
  Search,
  Film,
  FileImage,
} from "lucide-react";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
  url: string;
}

const BUCKET = "post-assets";

const Media = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(user.id, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      toast({ title: "Could not load files", variant: "destructive" });
      setLoading(false);
      return;
    }

    const mapped: MediaFile[] = (data || [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => ({
        name: f.name,
        id: f.id ?? f.name,
        created_at: f.created_at ?? "",
        metadata: f.metadata as MediaFile["metadata"],
        url: supabase.storage.from(BUCKET).getPublicUrl(`${user.id}/${f.name}`).data.publicUrl,
      }));

    setFiles(mapped);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    const uploadFiles = Array.from(e.target.files);

    for (const file of uploadFiles) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast({ title: `Failed: ${file.name}`, description: error.message, variant: "destructive" });
      }
    }

    toast({ title: `${uploadFiles.length} file(s) uploaded` });
    setUploading(false);
    e.target.value = "";
    fetchFiles();
  };

  const handleDelete = async (name: string) => {
    if (!user) return;
    await supabase.storage.from(BUCKET).remove([`${user.id}/${name}`]);
    toast({ title: "File deleted" });
    fetchFiles();
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
  const isVideo = (name: string) => /\.(mp4|mov|webm|avi)$/i.test(name);

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">Upload and organize your images and videos</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gradient-primary gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Images and videos
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <FolderPlus className="h-4 w-4" /> Create Folder
          </Button>
          <span className="text-xs text-muted-foreground self-center">Organize your content</span>
        </div>

        {/* Search & view toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex rounded-lg border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Files */}
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No media files yet</p>
            <p className="text-sm">Upload images and videos to get started</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group overflow-hidden transition-all hover:shadow-glow">
                <div className="aspect-square relative bg-muted">
                  {isImage(file.name) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : isVideo(file.name) ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-10 w-10 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileImage className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="rounded-full bg-white/20 p-2 hover:bg-destructive/80 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(file.metadata?.size)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {isImage(file.name) ? (
                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                  ) : isVideo(file.name) ? (
                    <Film className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileImage className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.metadata?.size)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="rounded p-1.5 hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Media;
