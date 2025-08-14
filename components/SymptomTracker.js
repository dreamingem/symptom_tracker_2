import React, { useState, useEffect } from 'react';
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
    heart_rate: '',
    duration: '',
    blood_pressure: '',
    notes: ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailMode, setDetailMode] = useState(false);

  // 사용자 이름 확인 및 설정
  useEffect(() => {
    const savedUserName = localStorage.getItem('symptom_tracker_user');
    if (savedUserName) {
      setUserName(savedUserName);
      loadRecords(savedUserName);
    } else {
      setShowUserSetup(true);
      setLoading(false);
    }
  }, []);

  const handleUserSetup = () => {
    if (tempUserName.trim()) {
      const finalUserName = tempUserName.trim();
      setUserName(finalUserName);
      localStorage.setItem('symptom_tracker_user', finalUserName);
      setShowUserSetup(false);
      loadRecords(finalUserName);
    }
  };

  const changeUser = () => {
    localStorage.removeItem('symptom_tracker_user');
    setUserName('');
    setTempUserName('');
    setRecords([]);
    setShowUserSetup(true);
  };

  const loadRecords = async (user) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_name', user)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('데이터 로드 실패:', error);
        const localData = localStorage.getItem(`symptomRecords_${user}`);
        if (localData) {
          setRecords(JSON.parse(localData));
        }
      } else {
        setRecords(data || []);
        localStorage.setItem(`symptomRecords_${user}`, JSON.stringify(data || []));
      }
    } catch (error) {
      console.error('네트워크 오류:', error);
      const localData = localStorage.getItem(`symptomRecords_${user}`);
      if (localData) {
        setRecords(JSON.parse(localData));
      }
    }
    setLoading(false);
  };

  const saveToSupabase = async (record) => {
    const recordWithUser = { ...record, user_name: userName };
    const { data, error } = await supabase
      .from('symptoms')
      .insert([recordWithUser])
      .select();

    if (error) {
      throw error;
    }
    return data[0];
  };

  const handleSubmit = async () => {
    setSaving(true);
    
    const newRecord = {
      ...currentRecord,
      created_at: new Date().toISOString()
    };

    try {
      const savedRecord = await saveToSupabase(newRecord);
      setRecords(prev => [savedRecord, ...prev]);
      
      const updatedRecords = [savedRecord, ...records];
      localStorage.setItem(`symptomRecords_${userName}`, JSON.stringify(updatedRecords));

      setCurrentRecord({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        activity: '',
        heart_rate: '',
        duration: '',
        blood_pressure: '',
        notes: ''
      });
      
      setShowForm(false);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
    
    setSaving(false);
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
      await supabase.from('symptoms').delete().eq('id', id);
      const updatedRecords = records.filter(record => record.id !== id);
      setRecords(updatedRecords);
      localStorage.setItem(`symptomRecords_${userName}`, JSON.stringify(updatedRecords));
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 사용자 설정 화면
  if (showUserSetup) {
    return (
      <div style={{ 
        maxWidth: '400px', 
        margin: '0 auto', 
        padding: '24px', 
        backgroundColor: 'white', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            증상 기록 앱
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            개인별 기록 관리를 위해 사용자 이름을 입력해주세요
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '18px', 
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
            style={{ 
              width: '100%', 
              padding: '16px', 
              border: '2px solid #D1D5DB', 
              borderRadius: '8px', 
              fontSize: '18px',
              outline: 'none'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleUserSetup()}
          />
        </div>

        <button
          onClick={handleUserSetup}
          disabled={!tempUserName.trim()}
          style={{ 
            width: '100%', 
            padding: '16px 24px', 
            backgroundColor: tempUserName.trim() ? '#3B82F6' : '#9CA3AF', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: tempUserName.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          시작하기
        </button>

        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#F3F4F6', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6B7280'
        }}>
          <p style={{ margin: 0, marginBottom: '8px' }}>💡 <strong>안내사항:</strong></p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>입력한 이름으로 개인 기록이 구분됩니다</li>
            <li>가족 구성원별로 다른 이름을 사용하세요</li>
            <li>언제든지 사용자를 변경할 수 있습니다</li>
          </ul>
        </div>
      </div>
    );
  }

  // 간단 모드 폼
  const SimpleForm = () => (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>빠른 기록</h1>
          <span style={{ 
            fontSize: '14px', 
            color: '#6B7280',
            backgroundColor: '#F3F4F6',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            👤 {userName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowForm(false)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6B7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3B82F6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>날짜</label>
            <input
              type="date"
              value={currentRecord.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '16px', 
                border: '1px solid #D1D5DB', 
                borderRadius: '8px', 
                fontSize: '18px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>시간</label>
            <input
              type="time"
              value={currentRecord.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '16px', 
                border: '1px solid #D1D5DB', 
                borderRadius: '8px', 
                fontSize: '18px'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>당시 하고 있던 일</label>
          <select
            value={currentRecord.activity}
            onChange={(e) => handleInputChange('activity', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px', 
              border: '1px solid #D1D5DB', 
              borderRadius: '8px', 
              fontSize: '18px'
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
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>두근거림 정도</label>
          <select
            value={currentRecord.heart_rate}
            onChange={(e) => handleInputChange('heart_rate', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px', 
              border: '1px solid #D1D5DB', 
              borderRadius: '8px', 
              fontSize: '18px'
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
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>지속 시간</label>
          <select
            value={currentRecord.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px', 
              border: '1px solid #D1D5DB', 
              borderRadius: '8px', 
              fontSize: '18px'
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
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>혈압 (선택사항)</label>
          <input
            type="text"
            value={currentRecord.blood_pressure}
            onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
            placeholder="예: 120/80"
            style={{ 
              width: '100%', 
              padding: '16px', 
              border: '1px solid #D1D5DB', 
              borderRadius: '8px', 
              fontSize: '18px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>특이사항 (선택사항)</label>
          <textarea
            value={currentRecord.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="특별히 기억할 만한 내용이 있다면..."
            style={{ 
              width: '100%', 
              padding: '16px', 
              border: '1px solid #D1D5DB', 
              borderRadius: '8px', 
              fontSize: '18px',
              height: '96px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ 
            width: '100%', 
            padding: '16px 24px', 
            backgroundColor: '#3B82F6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '20px',
            cursor: 'pointer',
            opacity: saving ? 0.5 : 1
          }}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );

  if (showForm) {
    return <SimpleForm />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⟳</div>
          <p style={{ fontSize: '18px' }}>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>증상 기록 관리</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '14px', 
              color: '#6B7280',
              backgroundColor: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: '16px'
            }}>
              👤 {userName}
            </span>
            <button
              onClick={changeUser}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
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
        <p style={{ color: '#6B7280' }}>체계적인 증상 기록으로 패턴을 파악하고 의료진과 효과적으로 소통하세요.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 24px', 
            backgroundColor: '#3B82F6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span> 빠른 기록
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>아직 기록된 증상이 없습니다.</p>
            <p>위의 "빠른 기록" 버튼으로 간편하게 시작해보세요.</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} style={{ 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px', 
              padding: '16px', 
              backgroundColor: '#F9FAFB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {record.date} {record.time}
                  </h3>
                  <p style={{ color: '#6B7280', margin: 0 }}>{record.activity}</p>
                </div>
                <button
                  onClick={() => deleteRecord(record.id)}
                  style={{ 
                    color: '#EF4444', 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '16px'
                  }}
                >
                  🗑️
                </button>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                fontSize: '14px' 
              }}>
                <div>
                  <span style={{ fontWeight: '500' }}>지속시간:</span> {record.duration}분
                </div>
                <div>
                  <span style={{ fontWeight: '500' }}>두근거림:</span> {record.heart_rate}/10
                </div>
                <div>
                  <span style={{ fontWeight: '500' }}>혈압:</span> {record.blood_pressure || '기록 없음'}
                </div>
              </div>
              
              {record.notes && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '14px', 
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
