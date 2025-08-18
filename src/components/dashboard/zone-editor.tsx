import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, CheckCircle, Mail, Phone, User, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Zone, Approver } from '@/lib/types';

interface ZoneEditorProps {
  initialZone: Zone;
  onSave: (zone: Zone) => void;
}

export default function ZoneEditor({ initialZone, onSave }: ZoneEditorProps) {
  const [zone, setZone] = useState<Zone>({ 
    ...initialZone, 
    streetAddress: initialZone.streetAddress ?? '',
    eventApprovers: initialZone.eventApprovers ?? [],
    scheduleApprovers: initialZone.scheduleApprovers ?? []
  });
  
  const [approverDialogOpen, setApproverDialogOpen] = useState(false);
  const [editingApproverType, setEditingApproverType] = useState<'eventApprovers' | 'scheduleApprovers'>('eventApprovers');
  const [editingApproverIndex, setEditingApproverIndex] = useState<number | null>(null);
  const [approverForm, setApproverForm] = useState({ name: '', mobile: '', email: '' });

  const addressValid = zone.streetAddress && zone.streetAddress.trim().length > 10 && 
                      zone.streetAddress.includes(' ') && 
                      /\d/.test(zone.streetAddress);

  const approverValid = approverForm.name.trim().length > 0 &&
                       /^\+?\d{8,15}$/.test(approverForm.mobile) &&
                       /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(approverForm.email);

  const isValid = addressValid;

  const addApprover = (type: 'eventApprovers' | 'scheduleApprovers') => {
    setEditingApproverType(type);
    setEditingApproverIndex(null);
    setApproverForm({ name: '', mobile: '', email: '' });
    setApproverDialogOpen(true);
  };

  const editApprover = (type: 'eventApprovers' | 'scheduleApprovers', index: number) => {
    setEditingApproverType(type);
    setEditingApproverIndex(index);
    const approvers = zone[type] || [];
    const approver = approvers[index];
    if (approver) {
      setApproverForm(approver);
    }
    setApproverDialogOpen(true);
  };

  const removeApprover = (type: 'eventApprovers' | 'scheduleApprovers', index: number) => {
    const currentApprovers = zone[type] || [];
    const updatedApprovers = [...currentApprovers];
    updatedApprovers.splice(index, 1);
    setZone({ ...zone, [type]: updatedApprovers });
  };

  const handleSaveApprover = () => {
    if (!approverValid) return;

    const currentApprovers = zone[editingApproverType] || [];
    const updatedApprovers = [...currentApprovers];
    if (editingApproverIndex !== null) {
      updatedApprovers[editingApproverIndex] = approverForm;
    } else {
      updatedApprovers.push(approverForm);
    }
    
    setZone({ ...zone, [editingApproverType]: updatedApprovers });
    setApproverDialogOpen(false);
  };

  const handleSave = () => {
    if (isValid) {
      onSave(zone);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 enhanced-card p-6 rounded-lg">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          Edit Zone
        </h2>
        <p className="text-xl text-muted-foreground">{zone.name}</p>
        <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full mt-4"></div>
      </div>
      
      <div className="space-y-8">
        {/* Address Section */}
        <Card className="enhanced-card border-l-4 border-l-primary shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Zone Address
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Street Address</label>
              <Input
                value={zone.streetAddress}
                onChange={e => setZone({ ...zone, streetAddress: e.target.value })}
                placeholder="123 Main St, Suburb, State, Postcode"
                className={cn(
                  "enhanced-select transition-all duration-200 text-base",
                  addressValid 
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                    : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                )}
              />
              {!addressValid && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Please enter a valid address with street number and name.
                </div>
              )}
              {addressValid && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Address looks good!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Approvers Section */}
        <Card className="enhanced-card border-l-4 border-l-emerald-500 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-500" />
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Zone Calendar Event Approvers
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(zone.eventApprovers || []).map((approver, index) => (
                <div key={index} className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-600" />
                        {approver.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {approver.mobile}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {approver.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editApprover('eventApprovers', index)} className="premium-button-outline hover:bg-emerald-50">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeApprover('eventApprovers', index)} className="hover:shadow-md">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {(zone.eventApprovers || []).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No event approvers configured</p>
                  <p className="text-sm">Add someone who can approve calendar events for this zone</p>
                </div>
              )}
              <Button 
                onClick={() => addApprover('eventApprovers')} 
                variant="outline" 
                className="premium-button-outline w-full border-dashed border-2 h-14 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Event Approver
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Approvers Section */}
        <Card className="enhanced-card border-l-4 border-l-purple-500 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Zone Schedule Approvers
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(zone.scheduleApprovers || []).map((approver, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" />
                        {approver.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {approver.mobile}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {approver.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editApprover('scheduleApprovers', index)} className="premium-button-outline hover:bg-purple-50">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeApprover('scheduleApprovers', index)} className="hover:shadow-md">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {(zone.scheduleApprovers || []).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No schedule approvers configured</p>
                  <p className="text-sm">Add someone who can approve schedule changes for this zone</p>
                </div>
              )}
              <Button 
                onClick={() => addApprover('scheduleApprovers')} 
                variant="outline" 
                className="premium-button-outline w-full border-dashed border-2 h-14 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Schedule Approver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-border">
        <Button variant="outline" onClick={() => window.history.back()} className="premium-button-outline px-8 py-2 text-base">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!isValid}
          className="premium-button px-8 py-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Zone
        </Button>
      </div>

      {/* Approver Dialog */}
      <Dialog open={approverDialogOpen} onOpenChange={setApproverDialogOpen}>
        <DialogContent className="max-w-md glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {editingApproverIndex !== null ? 'Edit' : 'Add'} Approver
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Full Name</label>
              <Input
                value={approverForm.name}
                onChange={e => setApproverForm({ ...approverForm, name: e.target.value })}
                placeholder="John Smith"
                className="enhanced-select text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Mobile Number</label>
              <Input
                value={approverForm.mobile}
                onChange={e => setApproverForm({ ...approverForm, mobile: e.target.value })}
                placeholder="+61400123456 or 0400123456"
                type="tel"
                className={cn(
                  "enhanced-select text-base transition-all duration-200",
                  /^\+?\d{8,15}$/.test(approverForm.mobile) 
                    ? 'border-green-300 focus:border-green-500' 
                    : 'border-red-300 focus:border-red-500'
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Email Address</label>
              <Input
                value={approverForm.email}
                onChange={e => setApproverForm({ ...approverForm, email: e.target.value })}
                placeholder="john@example.com"
                type="email"
                className={cn(
                  "enhanced-select text-base transition-all duration-200",
                  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(approverForm.email) 
                    ? 'border-green-300 focus:border-green-500' 
                    : 'border-red-300 focus:border-red-500'
                )}
              />
            </div>
            {!approverValid && approverForm.name && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                Please enter valid details for all fields.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproverDialogOpen(false)} className="premium-button-outline px-6">
              Cancel
            </Button>
            <Button
              onClick={handleSaveApprover}
              disabled={!approverValid}
              className="premium-button px-6"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Approver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
