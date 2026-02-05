'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  UserCog,
  Trash2,
  MoreVertical,
  User
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
  };
}

export default function AdminUsersPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(data || []);
    } catch (error: unknown) {
      console.error('Failed to fetch users:', error);
      setToast({
        message: '사용자 목록을 불러오는데 실패했습니다.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, isAdmin, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    if (!confirm(`"${userName}" 사용자의 권한을 ${getRoleLabel(newRole)}(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      await adminApi.updateUserRole(userId, newRole);
      setToast({
        message: '사용자 권한이 변경되었습니다.',
        type: 'success'
      });
      fetchUsers();
      setShowActionMenu(null);
    } catch (error: unknown) {
      console.error('Failed to update role:', error);
      setToast({
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '권한 변경에 실패했습니다.',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      setToast({
        message: '사용자가 삭제되었습니다.',
        type: 'success'
      });
      fetchUsers();
      setShowActionMenu(null);
    } catch (error: unknown) {
      console.error('Failed to delete user:', error);
      setToast({
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || '사용자 삭제에 실패했습니다.',
        type: 'error'
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap = {
      admin: '관리자',
      user: '일반 사용자',
      guest: '게스트',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: { icon: ShieldCheck, color: 'bg-red-100 text-red-800' },
      user: { icon: User, color: 'bg-blue-100 text-blue-800' },
      guest: { icon: Shield, color: 'bg-slate-100 text-slate-800' },
    };
    const roleStyle = roleStyles[role as keyof typeof roleStyles] || roleStyles.user;
    const Icon = roleStyle.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${roleStyle.color}`}>
        <Icon className="w-3 h-3" />
        {getRoleLabel(role)}
      </span>
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(searchQuery))
  );

  if (isChecking || loading) {
    return <Loading fullScreen message="사용자 목록 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">사용자 관리</h1>
          <p className="text-slate-600">전체 {filteredUsers.length}명의 사용자</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input pl-10"
              >
                <option value="all">전체 권한</option>
                <option value="admin">관리자</option>
                <option value="user">일반 사용자</option>
                <option value="guest">게스트</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">사용자가 없습니다</h2>
            <p className="text-slate-600">
              {searchQuery || roleFilter !== 'all'
                ? '검색 조건에 맞는 사용자가 없습니다.'
                : '등록된 사용자가 없습니다.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold truncate">{user.name}</h3>
                            {getRoleBadge(user.role)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-600 mb-1">주문 수</p>
                          <p className="font-bold text-violet-600">{user._count?.orders || 0}건</p>
                        </div>
                        <div className="border-l border-slate-300 pl-4">
                          <p className="text-xs text-slate-600 mb-1">가입일</p>
                          <p className="font-medium text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div className="border-l border-slate-300 pl-4">
                          <p className="text-xs text-slate-600 mb-1">마지막 업데이트</p>
                          <p className="font-medium text-sm">
                            {new Date(user.updatedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showActionMenu === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                            <div className="px-3 py-2 border-b border-slate-200">
                              <p className="text-xs font-medium text-slate-600">권한 변경</p>
                            </div>
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin', user.name)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                              disabled={user.role === 'admin'}
                            >
                              <ShieldCheck className="w-4 h-4" />
                              관리자로 변경
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, 'user', user.name)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2"
                              disabled={user.role === 'user'}
                            >
                              <UserCog className="w-4 h-4" />
                              일반 사용자로 변경
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, 'guest', user.name)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                              disabled={user.role === 'guest'}
                            >
                              <Shield className="w-4 h-4" />
                              게스트로 변경
                            </button>
                            <hr className="my-2" />
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              사용자 삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="card mt-6 p-6">
          <h2 className="text-xl font-bold mb-4">사용자 통계</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">관리자</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {users.filter(u => u.role === 'admin').length}명
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">일반 사용자</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {users.filter(u => u.role === 'user').length}명
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-800">게스트</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.role === 'guest').length}명
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}
