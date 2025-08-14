import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // 모바일 브라우저 감지
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // 안전한 localStorage 접근
  const safeLocalStorage = useMemo(() => ({
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage.getItem 실패:', e);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.warn('localStorage.setItem 실패:', e);
        return false;
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.warn('localStorage.removeItem 실패:', e);
        return false;
      }
    }
  }), []);

  // 데이터 정제 함수
  const sanitizeRecord = useCallback((record) => {
    try {
      const sanitized = JSON.parse(JSON.stringify(record));
      
      const integerFields = [
        'heart_rate', 
        'breathing', 
        'dizziness', 
        'speech_difficulty', 
        'measured_heart_rate', 
        'duration', 
        'recovery_heart_rate'
      ];
      
      integerFields.forEach(field => {
        if (sanitized[field] === '' || sanitized[field] === undefined || sanitized[field] === null) {
          sanitized[field] = null;
        } else {
          const num = parseInt(sanitized[field], 10);
          sanitized[field] = isNaN(num) ? null : num;
        }
      });

      sanitized.ecg_taken = Boolean(sanitized.ecg_taken === 'true' || sanitized.ecg_taken === true);

      const stringFields = [
        'activity', 'body_part', 'intake', 'start_feeling', 'start_type', 
        'premonition', 'sweating', 'weakness', 'chest_pain', 'blood_pressure', 
        'blood_sugar', 'after_effects', 'recovery_blood_pressure', 'recovery_actions', 
        'recovery_helpful', 'sleep_hours', 'stress', 'medications', 'notes'
      ];
      
      stringFields.forEach(field => {
        if (sanitized[field] === null || sanitized[field] === undefined) {
          sanitized[field] = '';
        } else {
          sanitized[field] = String(sanitized[field]);
        }
      });

      return sanitized;
    } catch (e) {
      console.error('데이터 정제 실패:', e);
      return record;
    }
  }, []);

  // 에러 핸들링
  const handleError = useCallback((error, context) => {
    const errorMessage = error && error.message ? error.message : String(error);
    console.error(`오류 발생 (${context}):`, error);
    
    if (isMobile) {
      setError(`${context} 오류가 발생했습니다.`);
    } else {
      setError(`${context}: ${errorMessage}`);
    }
  }, [isMobile]);

  // Supabase 연결 테스트
  const testSupabaseConnection = useCallback(async () => {
    try {
      console.log('Supabase 연결 테스트 시작...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('연결 시간 초과')), 10000);
      });
      
      const connectionPromise = supabase
        .from('symptoms')
        .select('count')
        .limit(1);

      const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      console.log('Supabase 연결 성공');
      setConnectionStatus('connected');
      setError(null);
      return true;
    } catch (err) {
      console.error('Supabase 연결 실패:', err);
      setConnectionStatus('offline');
      handleError(err, '데이터베이스 연결');
      return false;
    }
  }, [handleError]);

  // 초기화
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        await testSupabaseConnection();

        const savedUserName = safeLocalStorage.getItem('symptom_tracker_user');
        if (savedUserName) {
          setUserName(savedUserName);
          await loadRecords(savedUserName);
        } else {
          setShowUserSetup(true);
        }
      } catch (error) {
        handleError(error, '앱 초기화');
        setShowUserSetup(true);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(initialize, 100);
    return () => clearTimeout(timer);
  }, [testSupabaseConnection, handleError, safeLocalStorage]);

  const handleUserSetup = useCallback(async () => {
    try {
      if (tempUserName && tempUserName.trim()) {
        const finalUserName = tempUserName.trim();
        setUserName(finalUserName);
        safeLocalStorage.setItem('symptom_tracker_user', finalUserName);
        setShowUserSetup(false);
        await loadRecords(finalUserName);
      }
    } catch (error) {
      handleError(error, '사용자 설정');
    }
  }, [tempUserName, handleError, safeLocalStorage]);

  const changeUser = useCallback(() => {
    try {
      safeLocalStorage.removeItem('symptom_tracker_user');
      setUserName('');
      setTempUserName('');
      setRecords([]);
      setShowUserSetup(true);
      setError(null);
    } catch (error) {
      handleError(error, '사용자 변경');
    }
  }, [handleError, safeLocalStorage]);

  const loadRecords = useCallback(async (user) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`사용자 ${user}의 기록 로드 중...`);

      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_name', user)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const records = data || [];
      console.log(`${records.length}개의 기록을 로드했습니다.`);
      setRecords(records);
      safeLocalStorage.setItem(`symptomRecords_${user}`, JSON.stringify(records));
      
    } catch (error) {
      handleError(error, '데이터 로드');
      
      try {
        const localData = safeLocalStorage.getItem(`symptomRecords_${user}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          setRecords(parsedData);
          console.log('로컬 백업에서 데이터 복구됨');
        }
      } catch (localError) {
        console.error('로컬 데이터 복구 실패:', localError);
      }
    } finally {
      setLoading(false);
    }
  }, [handleError, safeLocalStorage]);

  const saveToSupabase = useCallback(async (record) => {
    console.log('저장 시작:', record);
    
    const sanitizedRecord = sanitizeRecord(record);
    
    const recordWithUser = { 
      ...sanitizedRecord, 
      user_name: userName,
      created_at: new Date().toISOString()
    };

    console.log('정제된 데이터:', recordWithUser);

    const { data, error } = await supabase
      .from('symptoms')
      .insert([recordWithUser])
      .select();

    if (error) {
      throw error;
    }

    console.log('저장 성공:', data[0]);
    return data[0];
  }, [userName, sanitizeRecord]);

  const handleSubmit = useCallback(async () => {
    if (saving) return;
    
    setSaving(true);
    setError(null);

    try {
      console.log('데이터 저장 시작...');

      if (!currentRecord.date || !currentRecord.time) {
        throw new Error('날짜와 시간은 필수입니다.');
      }

      const savedRecord = await saveToSupabase(currentRecord);
      
      setRecords(prev => [savedRecord, ...prev]);
      
      const updatedRecords = [savedRecord, ...records];
      safeLocalStorage.setItem(`symptomRecords_${userName}`, JSON.stringify(updatedRecords));

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
      console.log('저장 완료!');
      
    } catch (error) {
      handleError(error, '데이터 저장');
    } finally {
      setSaving(false);
    }
  }, [saving, currentRecord, records, userName, saveToSupabase, handleError, safeLocalStorage]);

  const handleInputChange = useCallback((field, value) => {
    try {
      const integerFields = [
        'heart_rate', 'breathing', 'dizziness', 'speech_difficulty', 
        'measured_heart_rate', 'duration', 'recovery_heart_rate'
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

      setCurrentRecord(prev => ({
        ...prev,
        [field]: processedValue
      }));
    } catch (error) {
      console.error('입력 처리 오류:', error);
    }
  }, []);

  const deleteRecord = useCallback(async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      console.log('기록 삭제 중:', id);
      
      const { error } = await supabase
        .from('symptoms')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      const updatedRecords = records.filter(record => record.id !== id);
      setRecords(updatedRecords);
      safeLocalStorage.setItem(`symptomRecords_${userName}`, JSON.stringify(updatedRecords));
      
      console.log('삭제 완료');
    } catch (error) {
      handleError(error, '데이터 삭제');
    }
  }, [records, userName, handleError, safeLocalStorage]);

  // 에러 표시 컴포넌트
  const ErrorDisplay = useCallback(() => {
    if (!error) return null;
    
    return (
      <div style={{ 
        backgroundColor: '#FEF2F2', 
        border: '1px solid #FECACA', 
        borderRadius: '8px', 
        padding: '12px', 
        marginBottom: '16px',
        color: '#B91C1C',
        fontSize: isMobile ? '14px' : '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 오류</div>
            <div style={{ fontSize: isMobile ? '12px' : '14px' }}>{error}</div>
          </div>
          <button 
            onClick={() => setError(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#B91C1C', 
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
              minWidth: '24px',
              minHeight: '24px'
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }, [error, isMobile]);

  // 연결 상태 표시
  const ConnectionStatus = useCallback(() => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '14px' }}>
        {connectionStatus === 'connected' ? '📶' : 
         connectionStatus === 'offline' ? '📵' : '🔄'}
      </span>
      <span style={{ 
        fontSize: isMobile ? '12px' : '14px', 
        color: connectionStatus === 'connected' ? '#10B981' : 
               connectionStatus === 'offline' ? '#EF4444' : '#F59E0B' 
      }}>
        {connectionStatus === 'connected' ? '온라인' : 
         connectionStatus === 'offline' ? '오프라인' : '연결 중...'}
      </span>
    </div>
  ), [connectionStatus, isMobile]);

  // 모바일 스타일
  const mobileStyles = useMemo(() => ({
    container: {
      maxWidth: isMobile ? '100%' : '400px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px',
      backgroundColor: 'white',
      minHeight: '100vh'
    },
    input: {
      width: '100%',
      padding: isMobile ? '12px' : '16px',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      fontSize: isMobile ? '16px' : '18px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    button: {
      padding: isMobile ? '12px 16px' : '16px 24px',
      fontSize: isMobile ? '14px' : '16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      minHeight: '44px'
    }
  }), [isMobile]);

  // 사용자 설정 화면
  if (showUserSetup) {
    return (
      <div style={{ 
        ...mobileStyles.container,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <ErrorDisplay />
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: isMobile ? '24px' : '28px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '8px' 
          }}>
            증상 기록 앱
          </h1>
          <p style={{ 
            color: '#6B7280', 
            fontSize: isMobile ? '14px' : '16px',
            lineHeight: '1.5'
          }}>
            개인별 기록 관리를 위해 사용자 이름을 입력해주세요
          </p>
          
          <div style={{ marginTop: '12px' }}>
            <ConnectionStatus />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: isMobile ? '16px' : '18px', 
            fontWeight: '500', 
            marginBottom: '8px',
            color: '#374151'
          }}>
            사용자 이름
          </label>
          <input
            type="text"
            value={tempUserName}
            onChange={(e) => setTempUserName(e.target.value)}
            placeholder="예: 김아버지, 김철수 등"
            style={mobileStyles.input}
            onKeyPress={(e) => e.key === 'Enter' && handleUserSetup()}
          />
        </div>

        <button
          onClick={handleUserSetup}
          disabled={!tempUserName || !tempUserName.trim() || connectionStatus !== 'connected'}
          style={{ 
            ...mobileStyles.button,
            width: '100%', 
            backgroundColor: (tempUserName && tempUserName.trim() && connectionStatus === 'connected') ? '#3B82F6' : '#9CA3AF', 
            color: 'white', 
            fontWeight: '600'
          }}
        >
          {connectionStatus === 'connected' ? '시작하기' : '연결 대기 중...'}
        </button>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#F3F4F6', 
          borderRadius: '8px',
          fontSize: isMobile ? '12px' : '14px',
          color: '#6B7280'
        }}>
          <p style={{ margin: 0, marginBottom: '8px' }}>💡 <strong>안내사항:</strong></p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>입력한 이름으로 개인 기록이 구분됩니다</li>
            <li>가족 구성원별로 다른 이름을 사용하세요</li>
            <li>언제든지 사용자를 변경할 수 있습니다</li>
            <li>데이터는 클라우드에 안전하게 저장됩니다</li>
          </ul>
        </div>
      </div>
    );
  }

  // 간단 모드 폼
  if (showForm) {
    return (
      <div style={mobileStyles.container}>
        <ErrorDisplay />
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '8px',
            flexWrap: 'wrap'
          }}>
            <h1 style={{ 
              fontSize: isMobile ? '20px' : '24px', 
              fontWeight: 'bold', 
              color: '#111827',
              margin: 0
            }}>
              빠른 기록
            </h1>
            <span style={{ 
              fontSize: '12px', 
              color: '#6B7280',
              backgroundColor: '#F3F4F6',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              👤 {userName}
            </span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <ConnectionStatus />
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowForm(false)}
              style={{ 
                ...mobileStyles.button,
                padding: '8px 12px',
                backgroundColor: '#6B7280', 
                color: 'white'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || connectionStatus !== 'connected'}
              style={{ 
                ...mobileStyles.button,
                padding: '8px 12px',
                backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', 
                color: 'white',
                opacity: saving ? 0.5 : 1
              }}
            >
              {saving ? '저장 중...' : connectionStatus === 'connected' ? '저장' : '오프라인'}
            </button>
            <button
              onClick={() => setDetailMode(true)}
              style={{ 
                ...mobileStyles.button,
                padding: '8px 12px',
                backgroundColor: '#10B981', 
                color: 'white',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              상세모드
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: '12px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: isMobile ? '14px' : '18px', 
                fontWeight: '500', 
                marginBottom: '6px' 
              }}>
                날짜
              </label>
              <input
                type="date"
                value={currentRecord.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                style={mobileStyles.input}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: isMobile ? '14px' : '18px', 
                fontWeight: '500', 
                marginBottom: '6px' 
              }}>
                시간
              </label>
              <input
                type="time"
                value={currentRecord.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                style={mobileStyles.input}
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: isMobile ? '14px' : '18px', 
              fontWeight: '500', 
              marginBottom: '6px' 
            }}>
              당시 하고 있던 일
            </label>
            <select
              value={currentRecord.activity}
              onChange={(e) => handleInputChange('activity', e.target.value)}
              style={mobileStyles.input}
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
            <label style={{ 
              display: 'block', 
              fontSize: isMobile ? '14px' : '18px', 
              fontWeight: '500', 
              marginBottom: '6px' 
            }}>
              두근거림 정도
            </label>
            <select
              value={currentRecord.heart_rate || ''}
              onChange={(e) => handleInputChange('heart_rate', e.target.value)}
              style={mobileStyles.input}
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
            <label style={{ 
              display: 'block', 
              fontSize: isMobile ? '14px' : '18px', 
              fontWeight: '500', 
              marginBottom: '6px' 
            }}>
              지속 시간
            </label>
            <select
              value={currentRecord.duration || ''}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              style={mobileStyles.input}
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
            <label style={{ 
              display: 'block', 
              fontSize: isMobile ? '14px' : '18px', 
              fontWeight: '500', 
              marginBottom: '6px' 
            }}>
              혈압 (선택사항)
            </label>
            <input
              type="text"
              value={currentRecord.blood_pressure}
              onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
              placeholder="예: 120/80"
              style={mobileStyles.input}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: isMobile ? '14px' : '18px', 
              fontWeight: '500', 
              marginBottom: '6px' 
            }}>
              특이사항 (선택사항)
            </label>
            <textarea
              value={currentRecord.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="특별히 기억할 만한 내용이 있다면..."
              style={{ 
                ...mobileStyles.input,
                height: isMobile ? '80px' : '96px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={saving || connectionStatus !== 'connected'}
            style={{ 
              ...mobileStyles.button,
              width: '100%', 
              backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF', 
              color: 'white',
              fontSize: isMobile ? '16px' : '20px',
              fontWeight: '600',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? '저장 중...' : connectionStatus === 'connected' ? '저장하기' : '오프라인'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: isMobile ? '36px' : '48px',
