# Supabase Setup Guide

이 앱을 위한 Supabase 백엔드 설정 방법입니다.

## 1. 프로젝트 생성
1. [Supabase](https://supabase.com)에 로그인하고 새 프로젝트를 생성합니다.
2. 프로젝트가 생성되면 `Project Settings -> API`로 이동하여 **URL**과 **anon/public key**를 복사해둡니다.

## 2. 데이터베이스 테이블 생성
Supabase 대시보드의 **SQL Editor**로 이동하여 아래 SQL을 붙여넣고 **Run**을 클릭하세요.

```sql
-- 1. nodes 테이블 생성
create table public.nodes (
  id text not null primary key, -- UUID 대신 텍스트 ID도 지원
  user_id uuid references auth.users not null default auth.uid(),
  content text default '',
  parent_id text, -- 루트 노드는 null
  children jsonb default '[]'::jsonb,
  is_collapsed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RLS (Row Level Security) 활성화
-- 이 설정이 있어야 내 데이터는 '나'만 볼 수 있습니다.
alter table public.nodes enable row level security;

-- 3. 정책 생성 (내 데이터만 조회/수정/삭제 가능)
create policy "Users can view their own nodes" 
on public.nodes for select 
using (auth.uid() = user_id);

create policy "Users can insert their own nodes" 
on public.nodes for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own nodes" 
on public.nodes for update 
using (auth.uid() = user_id);

create policy "Users can delete their own nodes" 
on public.nodes for delete 
using (auth.uid() = user_id);

-- 4. Realtime 활성화 (선택 사항)
-- 다른 기기에서 변경된 내용을 실시간으로 받고 싶다면 활성화합니다.
-- Database -> Replication -> supabase_realtime 게시물에서 nodes 테이블 토글 켜기
```

## 3. 환경 변수 설정
프로젝트 루트의 `.env` 파일(또는 `.env.local`)에 복사해둔 키를 입력합니다.

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

설정이 완료되면 앱 내 로그인 화면에서 회원가입을 하고 데이터를 동기화할 수 있습니다.
