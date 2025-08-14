# 증상 기록 앱 📝

체계적인 증상 기록으로 패턴을 파악하고 의료진과 효과적으로 소통할 수 있는 웹 앱입니다.

## 🚀 주요 기능

- ✅ **간단한 기록**: 5개 핵심 항목으로 빠른 기록
- ✅ **클라우드 동기화**: Supabase를 통한 실시간 데이터 저장
- ✅ **오프라인 지원**: 인터넷 없어도 로컬 저장 후 나중에 동기화
- ✅ **모바일 친화적**: 스마트폰에서 사용하기 최적화
- ✅ **데이터 내보내기**: JSON 형태로 백업 가능
- ✅ **PWA 지원**: 앱처럼 설치 가능

## 🛠️ 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/symptom-tracker.git
cd symptom-tracker
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.local` 파일을 생성하고 Supabase 정보를 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Supabase 테이블 생성
Supabase SQL Editor에서 다음 쿼리 실행:

```sql
CREATE TABLE symptoms (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 기본 정보
  date DATE NOT NULL,
  time TIME NOT NULL,
  activity TEXT,
  body_part TEXT,
  intake TEXT,
  
  -- 증상 시작
  start_feeling TEXT,
  start_type TEXT,
  premonition TEXT,
  
  -- 증상 진행
  heart_rate INTEGER CHECK (heart_rate >= 1 AND heart_rate <= 10),
  sweating TEXT,
  breathing INTEGER CHECK (breathing >= 1 AND breathing <= 10),
  dizziness INTEGER CHECK (dizziness >= 1 AND dizziness <= 10),
  weakness TEXT,
  speech_difficulty INTEGER CHECK (speech_difficulty >= 1 AND speech_difficulty <= 10),
  chest_pain TEXT,
  
  -- 객관적 수치
  measured_heart_rate INTEGER,
  ecg_taken BOOLEAN DEFAULT FALSE,
  blood_pressure TEXT,
  blood_sugar TEXT,
  
  -- 지속시간 및 회복
  duration INTEGER,
  after_effects TEXT,
  recovery_heart_rate INTEGER,
  recovery_blood_pressure TEXT,
  recovery_actions TEXT,
  recovery_helpful TEXT,
  
  -- 기타
  sleep_hours TEXT,
  stress TEXT,
  medications TEXT,
  notes TEXT
);

-- Row Level Security 활성화
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

-- 기본 정책
CREATE POLICY "Users can manage their own data" ON symptoms
  FOR ALL USING (true);
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📱 배포

### Vercel 배포 (추천)
1. GitHub에 저장소 푸시
2. [Vercel.com](https://vercel.com) 접속
3. GitHub 저장소 연결
4. 환경변수 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
5. Deploy 클릭

### 다른 배포 방법
- Netlify
- Cloudflare Pages
- AWS Amplify

## 📁 프로젝트 구조

```
symptom-tracker/
├── components/
│   └── SymptomTracker.js    # 메인 컴포넌트
├── lib/
│   └── supabase.js          # Supabase 클라이언트
├── pages/
│   ├── _app.js              # Next.js 앱 설정
│   └── index.js             # 홈페이지
├── styles/
│   └── globals.css          # 전역 스타일
├── package.json             # 의존성 패키지
├── next.config.js           # Next.js 설정
└── tailwind.config.js       # Tailwind CSS 설정
```

## 🎯 사용법

1. **빠른 기록**: 증상 발생시 5개 핵심 항목만 기록
2. **패턴 파악**: 기록된 데이터로 증상 패턴 확인
3. **의료진 상담**: 데이터 내보내기 후 병원 방문시 활용
4. **가족 공유**: URL 공유로 가족과 함께 사용 가능

## ⚠️ 주의사항

- 이 앱은 의료 진단 도구가 아닙니다
- 응급 상황시에는 즉시 병원 방문하세요
- 정확한 진단은 의료 전문가와 상담하세요

## 🔧 기술 스택

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📞 지원

문제가 있거나 개선사항이 있다면 GitHub Issues에 등록해 주세요.

---

**건강한 기록, 건강한 삶** 💪