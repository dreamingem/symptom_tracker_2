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
    heart_rate: null,
    duration: null,
    blood_pressure: '',
    notes: ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('testing');

  // 모바일 감지
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 안전한 localStorage
  const getItem = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const setItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage 저장 실패');
    }
  };

  const removeItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage 삭제 실패');
    }
  };

  // 데이터 정제
  const sanitizeRecord = (record) => {
    const sanitized = { ...record };
    
    // 숫자 필드 처리
    if (sanitized.heart_rate === '' || sanitized.heart_rate === undefined) {
      sanitized.heart_rate = null;
    } else if (sanitized.heart_rate !== null) {
      const num = parseInt(sanitized.heart_rate, 10);
      sanitized.heart_rate = isNaN(num) ? null : num;
    }

    if (sanitized.duration === '' || sanitized.duration === undefined) {
      sanitized.duration = null;
    } else if (sanitized.duration !== null) {
      const num = parseInt(sanitized.duration, 10);
      sanitized.duration = isNaN(num) ? null : num;
    }

    // 문자열 필드 처리
    ['activity', 'blood_pressure', 'notes'].forEach(field => {
      if (sanitized[field] === null || sanitized[field] === undefined) {
        sanitized[field] = '';
      } else {
        sanitized[field] = String(sanitized[field]);
      }
    });

    return sanitized;
  };

  // Supabase 연결 테스트
  const testConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('count')
        .limit(1);

      if (error) throw error;

      setConnectionStatus('connected');
      setError(null);
      return true;
    } catch (err) {
      setConnectionStatus('offline');
      setError('데이터베이스 연결 실패');
      return false;
    }
  }, []);

  // 초기화
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      await testConnection();
      
      const saved = getItem('symptom_tracker_user');
      if (saved) {
        setUserName(saved);
        await loadRecords(saved);
      } else {
        setShowUserSetup(true);
      }
      
      setLoading(false);
    };

    init();
  }, [testConnection]);

  const handleUserSetup = async () => {
    if (tempUserName && tempUserName.trim()) {
      const name = tempUserName.trim();
      setUserName(name);
      setItem('symptom_tracker_user', name);
      setShowUserSetup(false);
      await loadRecords(name);
    }
  };

  const changeUser = () => {
    removeItem('symptom_tracker_user');
    setUserName('');
    setTempUserName('');
    setRecords([]);
    setShowUserSetup(true);
    setError(null);
  };

  const loadRecords = async (user) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_name', user)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      setItem(`symptomRecords_${user}`, JSON.stringify(data || []));
    } catch (error) {
      setError('데이터 로드 실패');
      
      // 로컬 백업 시도
      const local = getItem(`symptomRecords_${user}`);
      if (local) {
        setRecords(JSON.parse(local));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    
    setSaving(true);
    setError(null);

    try {
      if (!currentRecord.date || !currentRecord.time) {
        throw new Error('날짜와 시간은 필수입니다.');
      }

      const sanitized = sanitizeRecord(currentRecord);
      const recordWithUser = {
        ...sanitized,
        user_name: userName,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('symptoms')
        .insert([recordWithUser])
        .select();

      if (error) throw error;

      const savedRecord = data[0];
      setRecords(prev => [savedRecord, ...prev]);
      
      const updated = [savedRecord, ...records];
      setItem(`symptomRecords_${userName}`, JSON.stringify(updated));

      // 폼 초기화
      setCurrentRecord({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        activity: '',
        heart_rate: null,
        duration: null,
        blood_pressure: '',
        notes: ''
      });

      setShowForm(false);
    } catch (error) {
      setError(error.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const deleteRecord = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('symptoms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updated = records.filter(record => record.id !== id);
      setRecords(updated);
      setItem(`symptomRecords_${userName}`, JSON.stringify(updated));
    } catch (error) {
      setError('삭제에 실패했습니다.');
    }
  };

  // 공통 스타일
  const styles = {
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
      boxSizing: 'border-box',
      backgroundColor: 'white',
      color: '#111827'
    },
    button: {
      padding: isMobile ? '12px 16px' : '16px 24px',
      fontSize: isMobile ? '14px' : '16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      minHeight: '44px'
    }
  };

  // 에러 표시
  const ErrorDisplay = () => {
    if (!error) return null;
    
    return (
      <div style={{
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px',
        color: '#B91C1C'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 오류</div>
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#B91C1C',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // 연결 상태
  const ConnectionStatus = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '14px' }}>
        {connectionStatus === 'connected' ? '📶' : '📵'}
      </span>
      <span style={{
        fontSize: isMobile ? '12px' : '14px',
        color: connectionStatus === 'connected' ? '#10B981' : '#EF4444'
      }}>
        {connectionStatus === 'connected' ? '온라인' : '오프라인'}
      </span>
    </div>
  );

  // 사용자 설정 화면
  if (showUserSetup) {
    return (
      <div style={styles.container}>
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
            fontSize: isMobile ? '14px' : '16px'
          }}>
            사용자 이름을 입력해주세요
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
            style={styles.input}
            onKeyPress={(e) => e.key === 'Enter' && handleUserSetup()}
          />
        </div>

        <button
          onClick={handleUserSetup}
          disabled={!tempUserName || !tempUserName.trim() || connectionStatus !== 'connected'}
          style={{
            ...styles.button,
            width: '100%',
            backgroundColor: (tempUserName && tempUserName.trim() && connectionStatus === 'connected') ? '#3B82F6' : '#9CA3AF',
            color: 'white',
            fontWeight: '600'
          }}
        >
          {connectionStatus === 'connected' ? '시작하기' : '연결 대기 중...'}
        </button>
      </div>
    );
  }

  // 기록 입력 폼
  if (showForm) {
    return (
      <div style={styles.container}>
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
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                ...styles.button,
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
                ...styles.button,
                padding: '8px 12px',
                backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                opacity: saving ? 0.5 : 1
              }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#111827'
              }}>
                날짜
              </label>
              <input
                type="date"
                value={currentRecord.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#111827'
              }}>
                시간
              </label>
              <input
                type="time"
                value={currentRecord.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#111827'
            }}>
              당시 하고 있던 일
            </label>
            <select
              value={currentRecord.activity}
              onChange={(e) => handleInputChange('activity', e.target.value)}
              style={{
                ...styles.input,
                backgroundColor: 'white',
                color: '#111827'
              }}
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
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#111827'
            }}>
              두근거림 정도 (1-10)
            </label>
            <select
              value={currentRecord.heart_rate || ''}
              onChange={(e) => handleInputChange('heart_rate', e.target.value)}
              style={{
                ...styles.input,
                backgroundColor: 'white',
                color: '#111827'
              }}
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
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#111827'
            }}>
              지속 시간
            </label>
            <select
              value={currentRecord.duration || ''}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              style={{
                ...styles.input,
                backgroundColor: 'white',
                color: '#111827'
              }}
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
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#111827'
            }}>
              혈압 (선택사항)
            </label>
            <input
              type="text"
              value={currentRecord.blood_pressure}
              onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
              placeholder="예: 120/80"
              style={styles.input}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#111827'
            }}>
              특이사항 (선택사항)
            </label>
            <textarea
              value={currentRecord.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="특별히 기억할 만한 내용이 있다면..."
              style={{
                ...styles.input,
                height: '80px',
                resize: 'vertical',
                backgroundColor: 'white',
                color: '#111827'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={saving || connectionStatus !== 'connected'}
            style={{
              ...styles.button,
              width: '100%',
              backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    );
  }

  // 로딩 화면
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
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ⟳
          </div>
          <p style={{
            fontSize: '18px',
            color: '#6B7280'
          }}>
            데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 메인 화면
  return (
    <div style={{
      maxWidth: isMobile ? '100%' : '1024px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px',
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
      <ErrorDisplay />
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <h1 style={{
            fontSize: isMobile ? '24px' : '30px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            증상 기록 관리
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              color: '#6B7280',
              backgroundColor: '#F3F4F6',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              👤 {userName}
            </span>
            <button
              onClick={changeUser}
              style={{
                fontSize: '11px',
                padding: '4px 6px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              사용자 변경
            </button>
          </div>
        </div>
        
        <p style={{
          color: '#6B7280',
          fontSize: '14px',
          margin: '8px 0'
        }}>
          체계적인 증상 기록으로 패턴을 파악하고 의료진과 효과적으로 소통하세요.
        </p>
        
        <div style={{ marginTop: '8px' }}>
          <ConnectionStatus />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowForm(true)}
          disabled={connectionStatus !== 'connected'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 24px',
            backgroundColor: connectionStatus === 'connected' ? '#3B82F6' : '#9CA3AF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
            minHeight: '44px'
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          새 기록 추가
        </button>
      </div>

      {connectionStatus !== 'connected' && (
        <div style={{
          background: '#FEF3C7',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #F59E0B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <h3 style={{
                fontWeight: '600',
                color: '#92400E',
                marginBottom: '4px',
                fontSize: '14px'
              }}>
                데이터베이스 연결 필요
              </h3>
              <p style={{
                fontSize: '12px',
                color: '#78350F',
                margin: 0
              }}>
                새 기록을 저장하려면 인터넷 연결을 확인하고 페이지를 새로고침해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: '#EBF8FF',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #BFDBFE'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📱</span>
          <div>
            <h3 style={{
              fontWeight: '600',
              color: '#111827',
              marginBottom: '4px',
              fontSize: '14px'
            }}>
              앱처럼 사용하기
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#6B7280',
              margin: 0
            }}>
              브라우저 메뉴에서 "홈 화면에 추가"를 선택하면 스마트폰 앱처럼 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {records.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: '#6B7280'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '12px',
              opacity: 0.5
            }}>
              📝
            </div>
            <p style={{
              fontSize: '18px',
              marginBottom: '8px'
            }}>
              아직 기록된 증상이 없습니다.
            </p>
            <p style={{ fontSize: '16px' }}>
              위의 "새 기록 추가" 버튼으로 시작해보세요.
            </p>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#F9FAFB'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
                gap: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {record.date} {record.time}
                  </h3>
                  <p style={{
                    color: '#6B7280',
                    margin: 0,
                    fontSize: '14px'
                  }}>
                    {record.activity}
                  </p>
                </div>
                <button
                  onClick={() => deleteRecord(record.id)}
                  disabled={connectionStatus !== 'connected'}
                  style={{
                    color: connectionStatus === 'connected' ? '#EF4444' : '#9CA3AF',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
                    padding: '4px',
                    fontSize: '14px'
                  }}
                >
                  🗑️
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div>
                  <span style={{ fontWeight: '500' }}>지속시간:</span>{' '}
                  {record.duration ? `${record.duration}분` : '기록 없음'}
                </div>
                <div>
                  <span style={{ fontWeight: '500' }}>두근거림:</span>{' '}
                  {record.heart_rate ? `${record.heart_rate}/10` : '기록 없음'}
                </div>
                <div>
                  <span style={{ fontWeight: '500' }}>혈압:</span>{' '}
                  {record.blood_pressure || '기록 없음'}
                </div>
              </div>
              
              {record.notes && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  <span style={{ fontWeight: '500' }}>메모:</span> {record.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SymptomTracker;
