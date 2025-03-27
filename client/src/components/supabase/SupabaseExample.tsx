import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/use-supabase';
import { Loader2 } from 'lucide-react';

interface SupabaseDemoProps {
  userId: number;
}

export default function SupabaseExample({ userId }: SupabaseDemoProps) {
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const { useSupabaseQuery, useSupabaseCreate, useSupabaseDelete } = useSupabase('user_notes');
  
  // Fetch notes for the current user
  const { data: notes, isLoading, isError } = useSupabaseQuery({
    filters: { user_id: userId },
    orderBy: 'created_at',
    orderDirection: 'desc',
  });
  
  // Create mutation
  const createMutation = useSupabaseCreate();
  
  // Delete mutation
  const deleteMutation = useSupabaseDelete();
  
  const handleCreateNote = async () => {
    if (!note.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a note',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        content: note,
        user_id: userId,
      });
      
      setNote('');
      toast({
        title: 'Success',
        description: 'Note created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteNote = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Integration Demo</CardTitle>
        <CardDescription>Create and manage your notes using Supabase</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              onClick={handleCreateNote}
              disabled={createMutation.isPending || !note.trim()}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center text-destructive p-4">
              Failed to load notes
            </div>
          ) : notes?.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No notes yet. Create your first note!
            </div>
          ) : (
            <ul className="space-y-2">
              {notes?.map((note: any) => (
                <li key={note.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <span>{note.content}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span>Data stored in Supabase</span>
        <span>Real-time sync with database</span>
      </CardFooter>
    </Card>
  );
}