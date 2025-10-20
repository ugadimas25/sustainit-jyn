import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Edit, Trash2, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  status: string;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  reviewNotes?: string;
  metadata?: any;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "delete" | null>(null);

  // Fetch approval requests
  const { data: requests, isLoading } = useQuery<ApprovalRequest[]>({
    queryKey: ["/api/approvals"],
    enabled: !!user,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) =>
      fetch(`/api/approvals/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes: notes }),
        headers: { "Content-Type": "application/json" },
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Request Approved",
        description: "The request has been approved successfully.",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) =>
      fetch(`/api/approvals/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes: notes }),
        headers: { "Content-Type": "application/json" },
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Request Rejected",
        description: "The request has been rejected and returned to draft status.",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      fetch(`/api/approvals/${id}`, {
        method: "DELETE",
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Request Deleted",
        description: "The approval request has been deleted.",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete request",
        variant: "destructive",
      });
    },
  });

  const closeDialog = () => {
    setActionDialog(null);
    setSelectedRequest(null);
    setReviewNotes("");
  };

  const handleAction = () => {
    if (!selectedRequest) return;

    if (actionDialog === "approve") {
      approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    } else if (actionDialog === "reject") {
      rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    } else if (actionDialog === "delete") {
      deleteMutation.mutate(selectedRequest.id);
    }
  };

  // Navigate to the appropriate form for editing rejected submissions
  const handleReviseSubmission = (request: ApprovalRequest) => {
    // Store the approval request ID in localStorage for the form to pick up
    localStorage.setItem('revising_approval_id', request.id);
    localStorage.setItem('revising_entity_id', request.entityId);
    localStorage.setItem('revising_entity_type', request.entityType);

    // Map entity types to their respective pages
    const entityTypeToRoute: Record<string, string> = {
      estate_data: '/data-collection?type=estate',
      mill_data: '/data-collection?type=mill',
      smallholder_data: '/data-collection?type=smallholder',
      kcp_data: '/data-collection?type=kcp',
      bulking_data: '/data-collection?type=bulking',
      spatial_analysis: '/spatial-analysis',
      legality_assessment: '/legality-compliance',
      risk_assessment: '/risk-analysis',
      supply_chain_linkage: '/supply-chain',
      dds_report: '/due-diligence-report',
    };

    const route = entityTypeToRoute[request.entityType];
    
    if (route) {
      toast({
        title: "Opening Form",
        description: "Redirecting you to edit your submission...",
      });
      setLocation(route);
    } else {
      toast({
        title: "Error",
        description: "Cannot find the form for this entity type.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canApprove = hasPermission("approval_workflow.approve_data");
  const canReject = hasPermission("approval_workflow.reject_data");
  const canDelete = hasPermission("approval_workflow.review_data");

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;
  const approvedCount = requests?.filter(r => r.status === "approved").length || 0;
  const rejectedCount = requests?.filter(r => r.status === "rejected").length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Approval Workflow</h1>
          <p className="text-muted-foreground mt-1">
            Manage and review data approval requests
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Returned to draft</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
          <CardDescription>
            Review and manage approval requests from creators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : requests && requests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium capitalize">
                        {request.entityType.replace("_", " ")}
                      </TableCell>
                      <TableCell>{request.entityName || request.entityId}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.comments || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            {canApprove && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog("approve");
                                }}
                                data-testid={`button-approve-${request.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {canReject && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog("reject");
                                }}
                                data-testid={`button-reject-${request.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog("delete");
                                }}
                                data-testid={`button-delete-${request.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ) : request.status === "rejected" && request.submittedBy === user?.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            onClick={() => handleReviseSubmission(request)}
                            data-testid={`button-edit-${request.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Revise & Resubmit
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            <FileText className="w-4 h-4 mr-1" />
                            {request.status === "approved" ? "Approved" : "Rejected"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No approval requests found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === "approve" && "Approve Request"}
              {actionDialog === "reject" && "Reject Request"}
              {actionDialog === "delete" && "Delete Request"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === "approve" && "Add notes to approve this request. The data will move to the next stage."}
              {actionDialog === "reject" && "Add notes to reject this request. The data will return to draft status for the creator to revise."}
              {actionDialog === "delete" && "Are you sure you want to delete this approval request? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {(actionDialog === "approve" || actionDialog === "reject") && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  placeholder={actionDialog === "approve" ? "Add approval notes..." : "Explain reason for rejection..."}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-review-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending}
              className={
                actionDialog === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionDialog === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
              data-testid={`button-confirm-${actionDialog}`}
            >
              {actionDialog === "approve" && "Approve"}
              {actionDialog === "reject" && "Reject"}
              {actionDialog === "delete" && "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
