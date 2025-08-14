import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, FileText, Download, Trash2, Save, Wifi, WifiOff, Smartphone, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SymptomTracker = () => {
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
    heart_rate: '',
    sweating: '',
    breathing: '',
    dizziness: '',
    weakness: '',
    speech_difficulty: '',
    chest_pain: '',
    measured_heart_rate: '',
    ecg_taken: false,
    blood_pressure: '',
    blood_sugar: '',
    duration: '',
    after_effects: '',
    recovery_heart_rate: '',
    recovery_blood_pressure: '',
    recovery_actions: '',
    recovery_helpful: '',
    sleep_hours: '',
    stress: '',
    medications: '',
    notes: ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simpleMode, setSimpleMode] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // 온라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadRecords();
  }, []);

  // Supabase에서 데이터 로드
  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('데이터 로드 실패:', error);
        // 오프라인이거나 에러시 로컬 스토리지에서 로드
        const localData = localStorage.getItem('symptomRecords');
        if (localData) {
          setRecords(JSON.parse(localData));
        }
      } else {
        setRecords(data || []);
        // 로컬 스토리지에도 백업
        localStorage.setItem('symptomRecords', JSON.stringify(data || []));
      }
    } catch (error) {
      console.error('네트워크 오류:', error);
      // 로컬 스토리지에서 로드
      const localData = localStorage.getItem('symptomRecords');
      if (localData) {
        setRecords(JSON.parse(localData));
      }
    }
    setLoading(false);
  };

  // Supabase에 데이터 저장
  const saveToSupabase = async (record) => {
    const { data, error } = await supabase
      .from('symptoms')
      .insert([record])
      .select();

    if (error) {
      throw error;
    }
    return data[0];
  };

  // 기록 삭제
  const deleteFromSupabase = async (id) => {
    const { error } = await supabase
      .from('symptoms')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    
    const newRecord = {
      ...currentRecord,
      created_at: new Date().toISOString()
    };

    try {
      if (isOnline) {
        // 온라인: Supabase에 저장
        const savedRecord = await saveToSupabase(newRecord);
        setRecords(prev => [savedRecord, ...prev]);
        
        // 로컬 스토리지에도 백업
        const updatedRecords = [savedRecord, ...records];
        localStorage.setItem('symptomRecords', JSON.stringify(updatedRecords));
      } else {
        // 오프라인: 로컬 스토리지에만 저장
        const localRecord = { ...newRecord, id: Date.now(), synced: false };
        const updatedRecords = [localRecord, ...records];
        setRecords(updatedRecords);
        localStorage.setItem('symptomRecords', JSON.stringify(updatedRecords));
      }

      // 폼 초기화
      setCurrentRecord({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        activity: '',
        body_part: '',
        intake: '',
        start_feeling: '',
        start_type: '',
        premonition: '',
        heart_rate: '',
        sweating: '',
        breathing: '',
        dizziness: '',
        weakness: '',
        speech_difficulty: '',
        chest_pain: '',
        measured_heart_rate: '',
        ecg_taken: false,
        blood_pressure: '',
        blood_sugar: '',
        duration: '',
        after_effects: '',
        recovery_heart_rate: '',
        recovery_blood_pressure: '',
        recovery_actions: '',
        recovery_helpful: '',
        sleep_hours: '',
        stress: '',
        medications: '',
        notes: ''
      });
      
      setShowForm(false);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
    
    setSaving(false);
  };

  const deleteRecord = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      if (isOnline) {
        await deleteFromSupabase(id);
      }
      
      const updatedRecords = records.filter(record => record.id !== id);
      setRecords(updatedRecords);
      localStorage.setItem('symptomRecords', JSON.stringify(updatedRecords));
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const exportData = () => {
    const exportData = records.map(record => ({
      날짜: record.date,
      시간: record.time,
      활동: record.activity,
      두근거림: record.heart_rate,
      지속시간: record.duration,
      혈압: record.blood_pressure,
      메모: record.notes,
      생성일시: record.created_at
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `증상기록_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // 간단 모드 폼
  const SimpleForm = () => (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">빠른 기록</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Save className="animate-spin" size={16} /> : <Save size={16} />}
            저장
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-medium mb-2">날짜</label>
            <input
              type="date"
              value={currentRecord.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full p-4 border rounded-lg text-lg"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">시간</label>
            <input
              type="time"
              value={currentRecord.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="w-full p-4 border rounded-lg text-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-lg font-medium mb-2">당시 하고 있던 일</label>
          <select
            value={currentRecord.activity}
            onChange={(e) => handleInputChange('activity', e.target.value)}
            className="w-full p-4 border rounded-lg text-lg"
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
          <label className="block text-lg font-medium mb-2">두근거림 정도</label>
          <select
            value={currentRecord.heart_rate}
            onChange={(e) => handleInputChange('heart_rate', e.target.value)}
            className="w-full p-4 border rounded-lg text-lg"
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
          <label className="block text-lg font-medium mb-2">지속 시간</label>
          <select
            value={currentRecord.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className="w-full p-4 border rounded-lg text-lg"
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
          <label className="block text-lg font-medium mb-2">혈압 (선택사항)</label>
          <input
            type="text"
            value={currentRecord.blood_pressure}
            onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
            placeholder="예: 120/80"
            className="w-full p-4 border rounded-lg text-lg"
          />
        </div>

        <div>
          <label className="block text-lg font-medium mb-2">특이사항 (선택사항)</label>
          <textarea
            value={currentRecord.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="특별히 기억할 만한 내용이 있다면..."
            className="w-full p-4 border rounded-lg text-lg h-24"
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Save className="animate-spin" size={24} /> : <Save size={24} />}
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-lg">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">증상 기록 관리</h1>
        <p className="text-gray-600">체계적인 증상 기록으로 패턴을 파악하고 의료진과 효과적으로 소통하세요.</p>
        
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {isOnline ? (
            <div className="flex items-center gap-1 text-green-600">
              <Wifi size={16} />
              <span className="text-sm">온라인 - 클라우드 동기화 활성</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-600">
              <WifiOff size={16} />
              <span className="text-sm">오프라인 - 로컬 저장 모드</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => {
            setSimpleMode(true);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg font-medium"
        >
          <Plus size={20} />
          빠른 기록
        </button>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          <Download size={16} />
          데이터 내보내기
        </button>
        <button
          onClick={loadRecords}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      {/* PWA 설치 안내 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-blue-200">
        <div className="flex items-center gap-3">
          <Smartphone className="text-blue-600" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900">📱 앱처럼 사용하기</h3>
            <p className="text-sm text-gray-600">
              브라우저 메뉴에서 "홈 화면에 추가"를 선택하면 스마트폰 앱처럼 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">아직 기록된 증상이 없습니다.</p>
            <p>위의 "빠른 기록" 버튼으로 간편하게 시작해보세요.</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {record.date} {record.time}
                    {record.synced === false && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                        동기화 대기
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600">{record.activity}</p>
                </div>
                <button
                  onClick={() => deleteRecord(record.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">지속시간:</span> {record.duration}분
                </div>
                <div>
                  <span className="font-medium">두근거림:</span> {record.heart_rate}/10
                </div>
                <div>
                  <span className="font-medium">혈압:</span> {record.blood_pressure || '기록 없음'}
                </div>
              </div>
              
              {record.notes && (
                <div className="mt-2 text-sm bg-white p-2 rounded">
                  <span className="font-medium">메모:</span> {record.notes}
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