'use client';

import { Save } from 'lucide-react';
import { Category, Tag } from '@/types';
import ImageUpload from '@/components/ImageUpload';

interface ProductFormProps {
  formData: {
    title: string;
    description: string;
    categoryId: string;
    baseDailyPrice: string;
    tags: string[];
    images: string[];
    detailImages: string[];
    status: string;
  };
  categories: Category[];
  allTags: Tag[];
  newTag: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onImagesChange: (images: string[]) => void;
  onDetailImagesChange: (detailImages: string[]) => void;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onNewTagChange: (tag: string) => void;
  onCreateNewTag: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  formData,
  categories,
  allTags,
  newTag,
  loading,
  onSubmit,
  onChange,
  onImagesChange,
  onDetailImagesChange,
  onAddTag,
  onRemoveTag,
  onNewTagChange,
  onCreateNewTag,
  onCancel,
}: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="card p-4 sm:p-6 lg:p-8">
      {/* 기본 정보 */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">기본 정보</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              상품명 *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={onChange}
              placeholder="예: 프랑스 혁명 시대 군복"
              className="input text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              상품 설명 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              placeholder="상품에 대한 자세한 설명을 입력하세요"
              className="input resize-none text-sm sm:text-base"
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-2">
                카테고리 *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={onChange}
                className="input text-sm sm:text-base"
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="baseDailyPrice" className="block text-sm font-medium text-slate-700 mb-2">
                일 대여료 (₩) *
              </label>
              <input
                id="baseDailyPrice"
                name="baseDailyPrice"
                type="number"
                value={formData.baseDailyPrice}
                onChange={onChange}
                placeholder="45000"
                className="input text-sm sm:text-base"
                min="0"
                step="1000"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
              상태 *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={onChange}
              className="input text-sm sm:text-base"
              required
            >
              <option value="active">활성 (대여 가능)</option>
              <option value="inactive">비활성 (대여 불가)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 이미지 업로드 */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">상품 이미지</h2>
        <ImageUpload
          label="메인 이미지"
          images={formData.images}
          onChange={onImagesChange}
          maxImages={5}
          helperText="첫 번째 이미지가 대표 이미지로 사용됩니다. 드래그하여 순서를 변경할 수 있습니다."
        />
      </div>

      {/* 상세 이미지 업로드 */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">상세 설명 이미지</h2>
        <ImageUpload
          label="상세 이미지"
          images={formData.detailImages}
          onChange={onDetailImagesChange}
          maxImages={10}
          helperText="상품 상세 페이지에 표시될 이미지들입니다. 순서대로 표시됩니다."
        />
      </div>

      {/* 태그 */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">태그</h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">상품을 검색하기 쉽도록 태그를 추가하세요</p>

        {/* 선택된 태그 */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 sm:p-4 bg-violet-50 rounded-lg">
            {formData.tags.map(tagId => {
              const tag = allTags.find(t => t.id === tagId);
              return tag ? (
                <span key={tagId} className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-violet-200 text-violet-800 rounded-full text-xs sm:text-sm font-medium">
                  #{tag.name}
                  <button type="button" onClick={() => onRemoveTag(tagId)} className="hover:text-violet-900">
                    <span className="text-xs">×</span>
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* 태그 선택 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {allTags
            .filter(tag => !formData.tags.includes(tag.id))
            .map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onAddTag(tag.id)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors text-left"
              >
                #{tag.name}
              </button>
            ))}
        </div>

        {/* 새 태그 추가 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => onNewTagChange(e.target.value)}
            placeholder="새 태그 입력"
            className="input flex-1 text-sm sm:text-base"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCreateNewTag();
              }
            }}
          />
          <button
            type="button"
            onClick={onCreateNewTag}
            className="btn btn-outline whitespace-nowrap text-sm sm:text-base"
          >
            태그 생성
          </button>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline flex-1 text-sm sm:text-base"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 h-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
              수정 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              변경사항 저장
            </>
          )}
        </button>
      </div>
    </form>
  );
}
