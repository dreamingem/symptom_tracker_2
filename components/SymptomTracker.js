// components/SymptomTracker.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SymptomTracker = () => {
  const [userName, setUserName] = useState('');
  const [tempUserName, setTempUserName] = useState('');
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [records, setRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    activity: '',
    body_part: '',
    intake: '',
    start_feeling: '',
    start_type: '',
    premonition: '',
    heart_rate: null,
    sweating: '',
    breathing: null,
    dizziness: null,
    weakness: '',
    speech_difficulty: null,
    chest_pain: '',
    measured_heart_rate: null,
    ecg_taken: false,
    blood_pressure: '',
    blood_sugar: '',
    duration: null,
    after_effects: '',
    recovery_heart_rate: null,
    recovery_blood_pressure: '',
    recovery_actions: '',
    recovery_helpful: '',
    sleep_hours: '',
    stress: '',
    medications: '',
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailMode, setDetailMode] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('testing');

  // ---------- helpers ----------
  const sanitizeRecord = (record) => {
    const sanitized = { ...record };
    const integerFields = [
      'heart_rate','breathing','dizziness','speech_difficulty',
      'measured_heart_rate','duration','recovery_heart_rate'
    ];
    integerFields.forEach(field => {
      if (sanitized[field] === '' || sanitized[field] === undefined) {
        sanitized[field] = null;
      } else if (sanitized[field] !== null) {
        const num = parseInt(sanitized[field], 10);
        sanitized[field] = isNaN(num) ? null : num;
      }
    });
    if (typeof sanitized.ecg_taken !== 'boolean') {
      sanitized.ecg_taken = sanitized.ecg_taken === 'true' || sanitized.ecg_taken === true;
    }
    const stringFields = [
      'activity','body_part','intake','start_feeling','start_type',
      'premonition','sweating','weakness','chest_pain','blood_pressure',
      'blood_sugar','after_effects','recovery_blood_pressure','recovery_actions',
      'recovery_helpful','sleep_hours','stress','medications','notes'
    ];
    stringFields.forEach(field => {
      if (sanitized[field] === null || sanitized[field] === undefined) sanitized[field] = '';
    });
    return sanitized;
  };

  const testSupabaseConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('symptoms').select('count').limit(1);
      if (error) {
        setConnectionStatus('offline');
        setError(`데이터베이스 연결 실패: ${error.message}`);
        return false;
      }
      setConnectionStatus('connected');
      setError(null);
      return true;
    } catch (err) {
      setConnectionStatus('offline');
      setError(`연결 오류: ${err.message}`);
      return false;
    }
  }, []);

  const loadRecords = async (user) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_name', user)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`데이터 로드 실패: ${error.message}`);
      setRecords(data || []);
      localStorage.setItem(`symptomRecords_${user}`, JSON.stringify(data || []));
    } catch (e) {
      setError(e.message);
      try {
        const localData = localStorage.getItem(`symptomRecords_${user}`);
        if (localData) setRecords(JSON.parse(localData));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const saveToSupabase = async (record) => {
    const sanitizedRecord = sanitizeRecord(record);
    const recordWithUser = {
      ...sanitizedRecord,
      user_name: userName,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('symptoms').insert([recordWithUser]).select();
    if (error) throw new Error(`저장 실패: ${error.message}`);
    return data[0];
  };

  // ---------- effects ----------
  useEffect(() => {
    const initialize = async () => {
      try {
        await testSupabaseConnection();
        const savedUserName = typeof window !== 'undefined' ? localStorage.getItem('symptom_tracker_user') : null;
        if (savedUserName) {
          setUserName(savedUserName);
          await loadRecords(savedUserName);
        } else {
          setShowUserSetup(true);
        }
      } catch (e) {
        setError(`초기화 실패: ${e.message}`);
        setShowUserSetup(true);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [testSupabaseConnection]);

  // ---------- handlers ----------
  const handleUserSetup = useCallback(async () => {
    try {
      if (tempUserName.trim()) {
        const finalUserName = tempUserName.trim();
        setUserName(finalUserName);
        localStorage.setItem('symptom_tracker_user', finalUserName);
        setShowUserSetup(false);
        await loadRecords(finalUserName);
      }
    } catch (e) {
      setError(`사용자 설정 실패: ${e.message}`);
    }
  }, [tempUserName]);

  const changeUser = useCallback(() => {
    try {
      localStorage.removeItem('symptom_tracker_user');
      setUserName('');
      setTempUserName('');
      setRecords([]);
      setShowUserSetup(true);
      setError(null);
    } catch (e) {
      setError(`사용자 변경 실패: ${e.message}`);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (!currentRecord.date || !currentRecord.time) throw new Error('날짜와 시간은 필수입니다.');
      const savedRecord = await saveToSupabase(currentRecord);
      setRecords(prev => [savedRecord, ...prev]);
      const updatedRecords = [savedRecord, ...records];
      localStorage.setItem(`symptomRecords_${userName}`, JSON.stringify(updatedRecords));
      setCurrentRecord({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        activity: '',
        body_part: '',
        intake: '',
        start_feeling: '',
        start_type: '',
        premonition: '',
        heart_rate: null,
        sweating: '',
        breathing: null,
        dizziness: null,
        weakness: '',
        speech_difficulty: null,
        chest_pain: '',
        measured_heart_rate: null,
        ecg_taken: false,
        blood_pressure: '',
        blood_sugar: '',
        duration: null,
        after_effects: '',
        recovery_heart_rate: null,
        recovery_blood_pressure: '',
        recovery_actions: '',
        recovery_helpful: '',
        sleep_hours: '',
        stress: '',
        medications: '',
        notes: ''
      });
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [currentRecord, records, userName]);

  const handleInputChange = useCallback((field, value) => {
    const integerFields = [
      'heart_rate','breathing','dizziness','speech_difficulty',
      'measured_heart_rate','duration','recovery_heart_rate'
    ];
    let processedValue = value;
    if (integerFields.includes(field)) {
      if (value === '' || value === null || value === undefined) {
        processedValue = null;
      } else {
        const num = parseInt(value, 10);
        processedValue = isNaN(num) ? null : num;
      }
    }
    setCurrentRecord(prev => ({ ...prev, [field]: processedValue }));
  }, []);

  // ---------- small components (no hooks inside) ----------
  const ErrorDisplay = () => error && (
    <div className="st-error" style={{
      backgroundColor: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      color: '#B91C1C'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ 오류 발생</div>
          <div style={{ fontSize: '14px', marginBottom: '12px' }}>{error}</div>
        </div>
        <button
          onClick={() => setError(null)}
          className="btn-ghost"
          style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: '20px', padding: '0 4px' }}
        >
          ×
        </button>
      </div>
    </div>
  );

  const ConnectionStatus = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '16px' }}>
        {connectionStatus === 'connected' ? '📶' :
         connectionStatus === 'offline' ? '📵' : '🔄'}
      </span>
      <span style={{
        fontSize: '14px',
        color: connectionStatus === 'connected' ? '#10B981' :
               connectionStatus === 'offline' ? '#EF4444' : '#F59E0B'
      }}>
        {connectionStatus === 'connected' ? '온라인 - 클라우드 동기화 활성' :
         connectionStatus === 'offline' ? '오프라인 - 연결 실패' : '연결 확인 중...'}
      </span>
    </div>
  );

  // ---------- render helpers (no hooks inside) ----------
  const renderSimpleForm = () => (
    <div className="st" style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', backgroundColor: 'white', minHeight: '100vh' }}>
      <ErrorDisplay />
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>빠른 기록</h1>
          <span className="chip" style={{ fontSize: '14px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '12px' }}>
            👤 {userName}
          </span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <ConnectionStatus />
        </div>
        <div className="row-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowForm(false)} className="btn" style={{ padding: '10px 16px', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || connectionStatus !== 'connected'}
            className="btn primary cta"
            style={{ padding: '10px 16px', backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '6px', cursor: (saving || connectionStatus !== 'connected') ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
          >
            {saving ? '저장 중...' : connectionStatus === 'connected' ? '저장' : '오프라인'}
          </button>
          <button
            onClick={() => setDetailMode(true)}
            className="btn"
            style={{ padding: '10px 12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            상세모드
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="grid-2">
          <div>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>날짜</label>
            <input
              key="date-input"
              type="date"
              value={currentRecord.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="input"
              style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>시간</label>
            <input
              key="time-input"
              type="time"
              value={currentRecord.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="input"
              style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>당시 하고 있던 일</label>
          <select
            key="activity-select"
            value={currentRecord.activity}
            onChange={(e) => handleInputChange('activity', e.target.value)}
            className="input"
            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
          >
            <option value="">선택하세요</option>
            <option value="커피 마시기">커피 마시기</option>
            <option value="업무 중">업무 중</option>
            <option value="대화 중">대화 중</option>
            <option value="식사 중">식사 중</option>
            <option value="휴식 중">휴식 중</option>
            <option value="운동 중">운동 중</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>두근거림 정도</label>
          <select
            key="heart-rate-select"
            value={currentRecord.heart_rate || ''}
            onChange={(e) => handleInputChange('heart_rate', e.target.value)}
            className="input"
            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
          >
            <option value="">선택하세요</option>
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <option key={num} value={num}>
                {num} - {num <= 3 ? '약함' : num <= 6 ? '보통' : num <= 8 ? '심함' : '매우심함'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>지속 시간</label>
          <select
            key="duration-select"
            value={currentRecord.duration || ''}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className="input"
            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
          >
            <option value="">선택하세요</option>
            <option value="5">5분 미만</option>
            <option value="10">5-10분</option>
            <option value="20">10-20분</option>
            <option value="30">20-30분</option>
            <option value="60">30분 이상</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>혈압 (선택사항)</label>
          <input
            key="blood-pressure-input"
            type="text"
            value={currentRecord.blood_pressure}
            onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
            placeholder="예: 120/80"
            className="input"
            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '6px' }}>특이사항 (선택사항)</label>
          <textarea
            key="notes-textarea"
            value={currentRecord.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="특별히 기억할 만한 내용이 있다면..."
            className="input"
            style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', height: '96px', resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="footer-cta">
        <button
          onClick={handleSubmit}
          disabled={saving || connectionStatus !== 'connected'}
          className="btn primary"
          style={{ width: '100%', padding: '16px 24px', backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: '600', opacity: saving ? 0.5 : 1 }}
        >
          {saving ? '저장 중...' : connectionStatus === 'connected' ? '저장하기' : '오프라인'}
        </button>
      </div>
    </div>
  );

  const renderDetailedForm = () => (
    <div className="st" style={{ maxWidth: '800px', margin: '0 auto', padding: '16px', backgroundColor: 'white', minHeight: '100vh' }}>
      <ErrorDisplay />
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>상세 증상 기록</h1>
          <span className="chip" style={{ fontSize: '14px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '12px' }}>
            👤 {userName}
          </span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <ConnectionStatus />
        </div>
        <div className="row-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowForm(false)} className="btn" style={{ padding: '10px 16px', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || connectionStatus !== 'connected'}
            className="btn primary cta"
            style={{ padding: '10px 16px', backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '6px', cursor: (saving || connectionStatus !== 'connected') ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
          >
            {saving ? '저장 중...' : connectionStatus === 'connected' ? '저장' : '오프라인'}
          </button>
          <button onClick={() => setDetailMode(false)} className="btn" style={{ padding: '10px 12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            간단모드
          </button>
        </div>
      </div>

      {/* 이하 섹션은 기존과 동일한 필드/스타일. 길어서 생략 없이 유지 */}
      {/* ① 시각·상황 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: '#EBF8FF', padding: '12px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1E40AF' }}>① 시각·상황</h2>
          <div className="grid-auto">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>날짜</label>
              <input
                key="detail-date-input"
                type="date"
                value={currentRecord.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>시간</label>
              <input
                key="detail-time-input"
                type="time"
                value={currentRecord.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>당시 하고 있던 일</label>
              <input
                key="detail-activity-input"
                type="text"
                value={currentRecord.activity}
                onChange={(e) => handleInputChange('activity', e.target.value)}
                placeholder="집중 작업, 대화, 운동, 식사, 커피 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>많이 사용한 신체 부위</label>
              <input
                key="detail-body-part-input"
                type="text"
                value={currentRecord.body_part}
                onChange={(e) => handleInputChange('body_part', e.target.value)}
                placeholder="어깨 근육, 거북목, 구부정한 자세 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>1시간 내 섭취한 음식·음료</label>
              <input
                key="detail-intake-input"
                type="text"
                value={currentRecord.intake}
                onChange={(e) => handleInputChange('intake', e.target.value)}
                placeholder="특히 카페인·알코올"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* ② 증상 시작 */}
        <div style={{ backgroundColor: '#FEF3C7', padding: '12px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#92400E' }}>② 증상 시작</h2>
          <div className="grid-auto">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>증상 시작 순간의 느낌</label>
              <input
                key="detail-start-feeling-input"
                type="text"
                value={currentRecord.start_feeling}
                onChange={(e) => handleInputChange('start_feeling', e.target.value)}
                placeholder="심장이 갑자기 빨라짐, 몸이 붕 뜨는 느낌, 땅으로 꺼지는 느낌"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>시작 양상</label>
              <select
                key="detail-start-type-select"
                value={currentRecord.start_type}
                onChange={(e) => handleInputChange('start_type', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                <option value="갑작스러움">갑작스러움</option>
                <option value="서서히">서서히</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>전조 증상</label>
              <input
                key="detail-premonition-input"
                type="text"
                value={currentRecord.premonition}
                onChange={(e) => handleInputChange('premonition', e.target.value)}
                placeholder="두통, 흉부 압박감, 시야 흐림 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* ③ 증상 진행 */}
        <div style={{ backgroundColor: '#FEE2E2', padding: '12px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#991B1B' }}>③ 증상 진행</h2>
          <div className="grid-auto">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>두근거림 정도 (1-10)</label>
              <select
                key="detail-heart-rate-select"
                value={currentRecord.heart_rate || ''}
                onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>식은땀 위치 및 양</label>
              <input
                key="detail-sweating-input"
                type="text"
                value={currentRecord.sweating}
                onChange={(e) => handleInputChange('sweating', e.target.value)}
                placeholder="이마, 등, 손바닥 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>호흡 곤란 정도 (1-10)</label>
              <select
                key="detail-breathing-select"
                value={currentRecord.breathing || ''}
                onChange={(e) => handleInputChange('breathing', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>어지럼/중심잡기 어려움 (1-10)</label>
              <select
                key="detail-dizziness-select"
                value={currentRecord.dizziness || ''}
                onChange={(e) => handleInputChange('dizziness', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>근육 힘 빠짐 정도</label>
              <select
                key="detail-weakness-select"
                value={currentRecord.weakness}
                onChange={(e) => handleInputChange('weakness', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                <option value="서있기 가능">서있기 가능</option>
                <option value="앉아야 함">앉아야 함</option>
                <option value="누워야 함">누워야 함</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>말하기 힘든 정도 (1-10)</label>
              <select
                key="detail-speech-difficulty-select"
                value={currentRecord.speech_difficulty || ''}
                onChange={(e) => handleInputChange('speech_difficulty', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>흉통/흉부 불편감</label>
              <input
                key="detail-chest-pain-input"
                type="text"
                value={currentRecord.chest_pain}
                onChange={(e) => handleInputChange('chest_pain', e.target.value)}
                placeholder="위치, 정도, 특징 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* ④ 객관적 수치 */}
        <div style={{ backgroundColor: '#ECFDF5', padding: '12px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#065F46' }}>④ 객관적 수치</h2>
          <div className="grid-auto">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>심박수 (bpm)</label>
              <input
                key="detail-measured-heart-rate-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentRecord.measured_heart_rate || ''}
                onChange={(e) => handleInputChange('measured_heart_rate', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>심전도 기록</label>
              <select
                key="detail-ecg-taken-select"
                value={currentRecord.ecg_taken}
                onChange={(e) => handleInputChange('ecg_taken', e.target.value === 'true')}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="false">아니오</option>
                <option value="true">예</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>혈압</label>
              <input
                key="detail-blood-pressure-input"
                type="text"
                value={currentRecord.blood_pressure}
                onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
                placeholder="예: 120/80"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>혈당</label>
              <input
                key="detail-blood-sugar-input"
                type="text"
                value={currentRecord.blood_sugar}
                onChange={(e) => handleInputChange('blood_sugar', e.target.value)}
                placeholder="예: 90 mg/dL"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* ⑤ 지속 시간 및 종료 후 상태 */}
        <div style={{ backgroundColor: '#F3E8FF', padding: '12px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#6B21A8' }}>⑤ 지속 시간 및 종료 후 상태</h2>
          <div className="grid-auto">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>증상 지속 시간 (분)</label>
              <input
                key="detail-duration-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentRecord.duration || ''}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>종료 후 남은 불편감</label>
              <input
                key="detail-after-effects-input"
                type="text"
                value={currentRecord.after_effects}
                onChange={(e) => handleInputChange('after_effects', e.target.value)}
                placeholder="피로, 무기력, 두통 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>회복 후 심박수</label>
              <input
                key="detail-recovery-heart-rate-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentRecord.recovery_heart_rate || ''}
                onChange={(e) => handleInputChange('recovery_heart_rate', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>회복 후 혈압</label>
              <input
                key="detail-recovery-blood-pressure-input"
                type="text"
                value={currentRecord.recovery_blood_pressure}
                onChange={(e) => handleInputChange('recovery_blood_pressure', e.target.value)}
                placeholder="예: 120/80"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>회복을 위해 시도한 행동</label>
              <input
                key="detail-recovery-actions-input"
                type="text"
                value={currentRecord.recovery_actions}
                onChange={(e) => handleInputChange('recovery_actions', e.target.value)}
                placeholder="간식이나 음료 섭취, 자리에 눕기, 눈 감기 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>해당 행동이 회복에 도움되었나요?</label>
              <select
                key="detail-recovery-helpful-select"
                value={currentRecord.recovery_helpful}
                onChange={(e) => handleInputChange('recovery_helpful', e.target.value)}
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              >
                <option value="">선택하세요</option>
                <option value="매우 도움됨">매우 도움됨</option>
                <option value="조금 도움됨">조금 도움됨</option>
                <option value="도움되지 않음">도움되지 않음</option>
                <option value="악화됨">악화됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* ⑥ 기타 참고 */}
        <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>⑥ 기타 참고</h2>
          <div className="grid-auto">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>최근 며칠간 수면 시간</label>
              <input
                key="detail-sleep-hours-input"
                type="text"
                value={currentRecord.sleep_hours}
                onChange={(e) => handleInputChange('sleep_hours', e.target.value)}
                placeholder="예: 5-6시간"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>스트레스 상황 여부</label>
              <input
                key="detail-stress-input"
                type="text"
                value={currentRecord.stress}
                onChange={(e) => handleInputChange('stress', e.target.value)}
                placeholder="업무, 인간관계, 건강 등"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>최근 복용 약물</label>
              <input
                key="detail-medications-input"
                type="text"
                value={currentRecord.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="약물명, 용량, 복용 시간"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>추가 메모</label>
              <textarea
                key="detail-notes-textarea"
                value={currentRecord.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="기타 특이사항이나 중요하다고 생각되는 내용"
                className="input"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', height: '90px', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-cta">
        <button
          onClick={handleSubmit}
          disabled={saving || connectionStatus !== 'connected'}
          className="btn primary"
          style={{ width: '100%', padding: '16px 32px', backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', opacity: saving ? 0.5 : 1 }}
        >
          {saving ? '저장 중...' : connectionStatus === 'connected' ? '기록 저장' : '오프라인'}
        </button>
      </div>
    </div>
  );

  // ---------- conditional returns (no hooks below here) ----------
  if (showUserSetup) {
    return (
      <div className="st" style={{
        maxWidth: '400px', margin: '0 auto', padding: '24px', backgroundColor: 'white',
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        <ErrorDisplay />
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>증상 기록 앱</h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>개인별 기록 관리를 위해 사용자 이름을 입력해주세요</p>
          <div style={{ marginTop: '12px' }}>
            <ConnectionStatus />
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
            사용자 이름
          </label>
          <input
            type="text"
            value={tempUserName}
            onChange={(e) => setTempUserName(e.target.value)}
            placeholder="예: 김아버지, 김철수 등"
            className="input"
            style={{ width: '100%', padding: '16px', border: '2px solid #D1D5DB', borderRadius: '8px', fontSize: '18px', outline: 'none' }}
            onKeyDown={(e) => e.key === 'Enter' && handleUserSetup()}
          />
        </div>
        <button
          onClick={handleUserSetup}
          disabled={!tempUserName.trim() || connectionStatus !== 'connected'}
          className="btn primary cta"
          style={{ width: '100%', padding: '16px 24px', backgroundColor: (tempUserName.trim() && connectionStatus === 'connected') ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '600', cursor: (tempUserName.trim() && connectionStatus === 'connected') ? 'pointer' : 'not-allowed' }}
        >
          {connectionStatus === 'connected' ? '시작하기' : '데이터베이스 연결 대기 중...'}
        </button>
        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px', fontSize: '14px', color: '#6B7280' }}>
          <p style={{ margin: 0, marginBottom: '8px' }}>💡 <strong>안내사항:</strong></p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>입력한 이름으로 개인 기록이 구분됩니다</li>
            <li>가족 구성원별로 다른 이름을 사용하세요</li>
            <li>언제든지 사용자를 변경할 수 있습니다</li>
            <li>데이터는 클라우드에 안전하게 저장됩니다</li>
          </ul>
        </div>

        {/* 모바일 글로벌 스타일(중복 선언 허용) */}
        <style jsx global>{``}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="st" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⟳</div>
          <p style={{ fontSize: '18px' }}>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return detailMode ? renderDetailedForm() : renderSimpleForm();
  }

  return (
    <div className="st" style={{ maxWidth: '1024px', margin: '0 auto', padding: '16px', backgroundColor: 'white', minHeight: '100vh' }}>
      <ErrorDisplay />
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827' }}>증상 기록 관리</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="chip" style={{ fontSize: '14px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '6px 12px', borderRadius: '16px' }}>
              👤 {userName}
            </span>
            <button onClick={changeUser} className="btn" style={{ fontSize: '12px', padding: '8px 10px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              사용자 변경
            </button>
          </div>
        </div>
        <p style={{ color: '#6B7280' }}>체계적인 증상 기록으로 패턴을 파악하고 의료진과 효과적으로 소통하세요.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <ConnectionStatus />
        </div>
      </div>

      <div className="row-actions" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setDetailMode(false); setShowForm(true); }}
          disabled={connectionStatus !== 'connected'}
          className="btn primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '500', cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed' }}
        >
          <span style={{ fontSize: '20px' }}>+</span> 빠른 기록
        </button>
        <button
          onClick={() => { setDetailMode(true); setShowForm(true); }}
          disabled={connectionStatus !== 'connected'}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: connectionStatus === 'connected' ? '#10B981' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed' }}
        >
          📋 상세 기록
        </button>
      </div>

      {connectionStatus !== 'connected' && (
        <div className="card warn" style={{ background: 'linear-gradient(to right, #FEF3C7, #FDE68A)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>⚠️</span>
            <div>
              <h3 style={{ fontWeight: '600', color: '#92400E', marginBottom: '4px' }}>데이터베이스 연결 필요</h3>
              <p style={{ fontSize: '14px', color: '#78350F', margin: 0 }}>
                새 기록을 저장하려면 데이터베이스 연결이 필요합니다. 인터넷 연결을 확인하고 페이지를 새로고침해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card info" style={{ background: 'linear-gradient(to right, #EBF8FF, #F3E8FF)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #BFDBFE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>📱</span>
          <div>
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>앱처럼 사용하기</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              브라우저 메뉴에서 "홈 화면에 추가"를 선택하면 스마트폰 앱처럼 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {records.length === 0 ? (
          <div className="empty" style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>아직 기록된 증상이 없습니다.</p>
            <p>위의 "빠른 기록" 버튼으로 간편하게 시작해보세요.</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="card" style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', backgroundColor: '#F9FAFB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {record.date} {record.time}
                  </h3>
                  <p style={{ color: '#6B7280', margin: 0 }}>{record.activity}</p>
                </div>
                <button
                  onClick={() => deleteRecord(record.id)}
                  disabled={connectionStatus !== 'connected'}
                  className="btn-ghost"
                  style={{ color: connectionStatus === 'connected' ? '#EF4444' : '#9CA3AF', backgroundColor: 'transparent', border: 'none', cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed', padding: '6px', fontSize: '16px' }}
                >
                  🗑️
                </button>
              </div>
              <div className="grid-auto small" style={{ gap: '10px', fontSize: '14px' }}>
                <div><span style={{ fontWeight: '500' }}>지속시간:</span> {record.duration ? `${record.duration}분` : '기록 없음'}</div>
                <div><span style={{ fontWeight: '500' }}>두근거림:</span> {record.heart_rate ? `${record.heart_rate}/10` : '기록 없음'}</div>
                <div><span style={{ fontWeight: '500' }}>혈압:</span> {record.blood_pressure || '기록 없음'}</div>
              </div>
              {record.notes && (
                <div style={{ marginTop: '8px', fontSize: '14px', backgroundColor: 'white', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '500' }}>메모:</span> {record.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 모바일 글로벌 스타일 */}
      <style jsx global>{`
        .st { -webkit-tap-highlight-color: transparent; padding-bottom: env(safe-area-inset-bottom); }
        .btn, .input, select, textarea {
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, 'Noto Sans KR', sans-serif;
        }
        input, select, textarea { font-size: 16px !important; min-height: 44px; }
        .btn { min-height: 44px; line-height: 1.2; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .grid-auto.small { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
        .footer-cta { position: sticky; bottom: 12px; z-index: 20; margin-top: 24px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.9) 40%); padding: 8px 0 0; }
        .btn-ghost { min-height: 44px; }
        .chip { white-space: nowrap; }
        @media (max-width: 480px) {
          .st { padding-left: 12px !important; padding-right: 12px !important; }
          h1 { font-size: 22px !important; }
          h2 { font-size: 16px !important; }
          .grid-2 { grid-template-columns: 1fr; }
          .row-actions { position: sticky; top: 0; padding: 8px 0; background: white; z-index: 15; }
        }
      `}</style>
    </div>
  );
};

export default SymptomTracker;
