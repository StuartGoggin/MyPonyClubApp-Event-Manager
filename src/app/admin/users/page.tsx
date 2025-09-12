'use client';

import { useState, useEffect } from 'react';
import { User, UserImportResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, UserPlus, Settings, AlertCircle, CheckCircle, Users, Search, Filter, X, MoreHorizontal } from 'lucide-react';
import { ImportPreviewDialog } from '@/components/admin/import-preview-dialog';
import { UserActionsDialog } from '@/components/admin/user-actions-dialog';
import { ImportPreviewResult } from '@/app/api/admin/users/import/preview/route';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RouteGuard } from '@/components/auth/route-guard';

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<UserImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validRows, setValidRows] = useState<any[]>([]);
  
  // User actions dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserActions, setShowUserActions] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
    loadClubsAndZones();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadClubsAndZones = async () => {
    try {
      const [clubsRes, zonesRes] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/zones')
      ]);
      
      const clubsData = await clubsRes.json();
      const zonesData = await zonesRes.json();
      
      setClubs(Array.isArray(clubsData) ? clubsData : clubsData.clubs || []);
      setZones(Array.isArray(zonesData) ? zonesData : zonesData.zones || []);
    } catch (err) {
      console.error('Failed to load clubs and zones:', err);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);
      setError(null);
      setPreviewData(null);
      
      console.log(`[Frontend] Starting preview for file: ${file.name}, size: ${file.size}`);
      
      // Step 1: Get preview data
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/users/import/preview', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('[Frontend] Preview response:', data);
      
      if (data.success) {
        // Use the complete valid rows data from preview
        const validRowsData = data.validRowsData || [];
        
        setPreviewData(data);
        setValidRows(validRowsData);
        setShowPreview(true);
      } else {
        // Enhanced error display with details
        let errorMessage = data.error || 'Preview failed';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += ':\n' + data.details.join('\n');
        }
        if (data.debug) {
          console.log('[Frontend] Debug info:', data.debug);
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('[Frontend] Preview error:', err);
      setError('Network error: Failed to communicate with server');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleConfirmImport = async (validRowsData: any[], fileName: string) => {
    try {
      setImporting(true);
      setError(null);
      
      console.log(`[Frontend] Starting confirmed import for ${fileName}: ${validRowsData.length} rows`);
      
      // Step 2: Confirm import with pre-validated data
      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validRows: validRowsData,
          fileName: fileName
        })
      });
      
      const data = await response.json();
      console.log('[Frontend] Import response:', data);
      
      if (data.success) {
        setImportResult({
          success: true,
          totalRows: data.results.validRows || 0,
          successfulImports: data.results.createdUsers + data.results.updatedUsers,
          failedImports: data.results.importErrors,
          createdUsers: data.results.createdUsers,
          updatedUsers: data.results.updatedUsers,
          errors: data.importErrors || [],
          importBatch: `import-${Date.now()}`,
          importedAt: new Date()
        });
        setShowPreview(false);
        await loadUsers(); // Reload users after import
      } else {
        let errorMessage = data.error || 'Import failed';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += ':\n' + data.details.join('\n');
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('[Frontend] Import error:', err);
      setError('Network error: Failed to communicate with server');
    } finally {
      setImporting(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
    setValidRows([]);
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/users/import');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_user': return 'destructive';
      case 'zone_rep': return 'default';
      case 'standard': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_user': return 'Super User';
      case 'zone_rep': return 'Zone Rep';
      case 'standard': return 'Standard';
      default: return role;
    }
  };

  const getClubName = (clubId: string) => {
    if (!clubId) return '-';
    const club = clubs.find(c => c.id === clubId);
    return club ? club.name : clubId;
  };

  const getZoneName = (zoneId: string) => {
    if (!zoneId) return '-';
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : zoneId;
  };

  // Create filtered users based on search and filter criteria
  const filteredUsers = users.filter(user => {
    // Search filter
    const searchMatch = searchTerm === '' || 
      user.ponyClubId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Role filter
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;

    // Status filter
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    // Club filter
    const clubMatch = clubFilter === 'all' || user.clubId === clubFilter;

    // Zone filter
    const zoneMatch = zoneFilter === 'all' || user.zoneId === zoneFilter;

    return searchMatch && roleMatch && statusMatch && clubMatch && zoneMatch;
  });

  // Get unique values for filter dropdowns
  const uniqueRoles = [...new Set(users.map(user => user.role))].sort();
  
  // Filter clubs based on selected zone
  const availableClubs = zoneFilter === 'all' 
    ? clubs 
    : clubs.filter(club => club.zoneId === zoneFilter);
    
  const uniqueClubs = [...new Set(users.map(user => user.clubId).filter(Boolean))]
    .sort()
    .map(clubId => ({
      id: clubId,
      name: getClubName(clubId)
    }))
    .filter(club => 
      zoneFilter === 'all' || 
      availableClubs.some(availableClub => availableClub.id === club.id)
    );
    
  const uniqueZones = [...new Set(users.map(user => user.zoneId).filter(Boolean))]
    .sort()
    .map(zoneId => ({
      id: zoneId,
      name: getZoneName(zoneId)
    }));

  // Handle zone filter change - clear club filter if selected club is not in new zone
  const handleZoneFilterChange = (newZoneFilter: string) => {
    setZoneFilter(newZoneFilter);
    
    // If a club is selected but it's not in the new zone, clear the club filter
    if (clubFilter !== 'all' && newZoneFilter !== 'all') {
      const selectedClub = clubs.find(club => club.id === clubFilter);
      if (selectedClub && selectedClub.zoneId !== newZoneFilter) {
        setClubFilter('all');
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setClubFilter('all');
    setZoneFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || roleFilter !== 'all' || statusFilter !== 'all' || clubFilter !== 'all' || zoneFilter !== 'all';

  const handleUserAction = (user: User) => {
    setSelectedUser(user);
    setShowUserActions(true);
  };

  const handleCloseUserActions = () => {
    setSelectedUser(null);
    setShowUserActions(false);
  };

  const handleUserUpdated = () => {
    loadUsers(); // Reload users after update
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and access permissions
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="whitespace-pre-line">{error}</div>
          </AlertDescription>
        </Alert>
      )}

      {importResult && (
        <Alert className="mb-6" variant={importResult.success ? "default" : "destructive"}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Import completed: {importResult.successfulImports} users processed ({importResult.createdUsers || 0} created, {importResult.updatedUsers || 0} updated), {importResult.failedImports} failed.
            {importResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">View errors ({importResult.errors.length})</summary>
                <ul className="mt-2 list-disc list-inside">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-sm">
                      Row {error.row}: {error.error}
                    </li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li className="text-sm">... and {importResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({hasActiveFilters ? `${filteredUsers.length}/${users.length}` : users.length})
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage all user accounts in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters Section */}
              <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {getRoleDisplayName(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={zoneFilter} onValueChange={handleZoneFilterChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {uniqueZones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={clubFilter} onValueChange={setClubFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      {uniqueClubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Summary */}
                {hasActiveFilters && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} users
                  </div>
                )}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pony Club ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          {hasActiveFilters ? 'No users match the current filters' : 'No users found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.ponyClubId}</TableCell>
                          <TableCell>
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {user.email ? (
                              <span className="text-sm">{user.email}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getClubName(user.clubId)}</TableCell>
                          <TableCell>{getZoneName(user.zoneId)}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt 
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUserAction(user)}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Manage User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Import Users</CardTitle>
                <CardDescription>
                  Upload a spreadsheet to import multiple users at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    disabled={importing}
                  />
                  <p className="text-sm text-muted-foreground">
                    Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
                  </p>
                </div>
                
                {importing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    Processing file...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Download Template</CardTitle>
                <CardDescription>
                  Get a sample spreadsheet with the correct format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadTemplate} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Required Columns:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pony Club ID (e.g., PC123456)</li>
                    <li>• Mobile Number (Australian format)</li>
                    <li>• Club Name (must exist in system)</li>
                    <li>• Zone Name (must exist in system)</li>
                    <li>• Role (Standard, Zone Rep, Super User)</li>
                  </ul>
                  
                  <h4 className="text-sm font-medium mt-4">Optional Columns:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• First Name</li>
                    <li>• Last Name</li>
                    <li>• Email</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Preview Dialog */}
      <ImportPreviewDialog
        isOpen={showPreview}
        onClose={handleClosePreview}
        previewData={previewData}
        onConfirmImport={handleConfirmImport}
        isImporting={importing}
        validRows={validRows}
      />

      {/* User Actions Dialog */}
      <UserActionsDialog
        user={selectedUser}
        isOpen={showUserActions}
        onClose={handleCloseUserActions}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <RouteGuard requireAuth={true} requiredRoles={['super_user']}>
      <UserManagementContent />
    </RouteGuard>
  );
}
