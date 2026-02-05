'use client';

interface User {
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface ProfileSectionProps {
  user: User;
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  return (
    <div className="card p-6">
      <form className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">이름</label>
            <input type="text" value={user.name} className="input" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">이메일</label>
            <input type="email" value={user.email} className="input" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">전화번호</label>
            <input type="tel" value={user.phone || ''} className="input" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">가입일</label>
            <input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString('ko-KR')}
              className="input"
              readOnly
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-bold mb-4">비밀번호 변경</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">현재 비밀번호</label>
              <input type="password" className="input" placeholder="현재 비밀번호를 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">새 비밀번호</label>
              <input type="password" className="input" placeholder="새 비밀번호를 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">새 비밀번호 확인</label>
              <input type="password" className="input" placeholder="새 비밀번호를 다시 입력하세요" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn btn-outline flex-1">
            취소
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            변경사항 저장
          </button>
        </div>
      </form>
    </div>
  );
}
