'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Loading from '@/components/Loading';
import Toast, { ToastType } from '@/components/Toast';
import useAdminAuth from '@/hooks/useAdminAuth';
import { categoryApi } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesManagementPage() {
  const { isChecking, isAdmin } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
  });

  useEffect(() => {
    if (!isChecking && isAdmin) {
      fetchCategories();
    }
  }, [isChecking, isAdmin]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setToast({ message: '카테고리 목록을 불러오는데 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setToast({ message: '카테고리 이름을 입력해주세요.', type: 'error' });
      return;
    }

    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

      if (editingCategory) {
        await categoryApi.update(editingCategory.id, {
          name: formData.name,
          slug,
          parentId: formData.parentId || null,
        });
        setToast({ message: '카테고리가 수정되었습니다.', type: 'success' });
      } else {
        await categoryApi.create({
          name: formData.name,
          slug,
          parentId: formData.parentId || null,
        });
        setToast({ message: '카테고리가 생성되었습니다.', type: 'success' });
      }

      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', parentId: '' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      setToast({ message: '카테고리 저장 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('정말 이 카테고리를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await categoryApi.delete(categoryId);
      setToast({ message: '카테고리가 삭제되었습니다.', type: 'success' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      setToast({ message: '카테고리 삭제 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', parentId: '' });
  };

  const rootCategories = categories.filter(c => !c.parentId);
  const getSubCategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  if (isChecking || loading) {
    return <Loading fullScreen message="카테고리 목록 로딩 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <FolderTree className="w-10 h-10 text-violet-600" />
              카테고리 관리
            </h1>
            <p className="text-slate-600">상품 카테고리를 생성하고 관리합니다</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            새 카테고리
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  카테고리 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="예: 의상, 소품, 무대장치"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  슬러그 (URL용)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input"
                  placeholder="자동 생성됩니다 (예: costume, props)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  비워두면 이름에서 자동으로 생성됩니다
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  상위 카테고리
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input"
                >
                  <option value="">없음 (최상위 카테고리)</option>
                  {rootCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="btn btn-outline flex-1">
                  취소
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          {rootCategories.length === 0 ? (
            <div className="card p-12 text-center">
              <FolderTree className="w-24 h-24 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">카테고리가 없습니다</h2>
              <p className="text-slate-600 mb-6">새 카테고리를 추가해보세요</p>
            </div>
          ) : (
            rootCategories.map((category) => (
              <div key={category.id} className="card">
                {/* Root Category */}
                <div className="p-6 flex items-center justify-between border-b border-slate-200">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-sm text-slate-600">
                      슬러그: {category.slug} • 생성: {new Date(category.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="btn btn-secondary"
                    >
                      <Edit className="w-4 h-4" />
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="btn bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {getSubCategories(category.id).length > 0 && (
                  <div className="p-6 bg-slate-50">
                    <p className="text-sm font-medium text-slate-700 mb-3">하위 카테고리:</p>
                    <div className="space-y-2">
                      {getSubCategories(category.id).map((subCat) => (
                        <div key={subCat.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-medium">{subCat.name}</p>
                            <p className="text-xs text-slate-600">슬러그: {subCat.slug}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(subCat)}
                              className="text-blue-600 hover:text-blue-700 p-2"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(subCat.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
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
