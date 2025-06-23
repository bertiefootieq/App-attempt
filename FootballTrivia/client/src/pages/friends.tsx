import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Users, Trophy, MoreHorizontal, Play } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFriendGroupSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const createGroupSchema = insertFriendGroupSchema.extend({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function Friends() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: friendGroups = [] } = useQuery({
    queryKey: ["/api/friend-groups", { userId: user?.id }],
    enabled: !!user,
  });

  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      createdBy: user?.id,
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      return apiRequest("POST", "/api/friend-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-groups"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Friend group created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create friend group", variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate({ ...data, createdBy: user?.id });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Friend Groups</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Friend Group</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter group name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your group..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createGroupMutation.isPending}
                  >
                    Create Group
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Friend Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friendGroups.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Friend Groups Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first friend group to start competing with your friends!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          friendGroups.map((group: any) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <Badge variant="secondary">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {group.description || "No description provided"}
                </p>
                
                {/* Group Members Preview */}
                <div className="flex -space-x-2 mb-4">
                  {/* Show placeholder avatars for now */}
                  {[...Array(Math.min(group.memberCount, 4))].map((_, index) => (
                    <Avatar key={index} className="border-2 border-background">
                      <AvatarFallback>
                        {index === 3 && group.memberCount > 4 ? 
                          `+${group.memberCount - 3}` : 
                          `M${index + 1}`
                        }
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>

                {/* Group Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{group.gamesPlayed}</div>
                    <div className="text-muted-foreground text-sm">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{group.activeStreak}</div>
                    <div className="text-muted-foreground text-sm">Day Streak</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Create New Group Card */}
        {friendGroups.length > 0 && (
          <Card 
            className="border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Create New Group</h3>
              <p className="text-muted-foreground text-sm">Start competing with more friends</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Popular Groups Section */}
      {friendGroups.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Group Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Most Active Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendGroups.length > 0 && (
                  <div>
                    <h4 className="font-semibold">{friendGroups[0].name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {friendGroups[0].gamesPlayed} games played
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Largest Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendGroups.length > 0 && (
                  <div>
                    <h4 className="font-semibold">
                      {friendGroups.reduce((max, group) => 
                        group.memberCount > max.memberCount ? group : max, friendGroups[0]
                      ).name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {friendGroups.reduce((max, group) => 
                        group.memberCount > max.memberCount ? group : max, friendGroups[0]
                      ).memberCount} members
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-green-500" />
                  Longest Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendGroups.length > 0 && (
                  <div>
                    <h4 className="font-semibold">
                      {friendGroups.reduce((max, group) => 
                        group.activeStreak > max.activeStreak ? group : max, friendGroups[0]
                      ).name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {friendGroups.reduce((max, group) => 
                        group.activeStreak > max.activeStreak ? group : max, friendGroups[0]
                      ).activeStreak} days
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
