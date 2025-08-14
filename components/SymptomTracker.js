import React, { useState, useEffect } from 'react';
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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailMode, setDetailMode] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('데이터 로드 실패:', error);
        const localData = localStorage.getItem('symptomRecords');
        if (localData) {
          setRecords(JSON.parse(localData));
        }
      } else {
        setRecords(data || []);
        localStorage.setItem('symptomRecords', JSON.stringify(data || []));
      }
    } catch (error) {
      console.error('네트워크 오류:', error);
      const localData = localStorage.getItem('symptomRecords');
      if (localData) {
        setRecords(JSON.parse(localData));
      }
    }
    setLoading(false);
  };

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
      const savedRecord = await saveToSupabase(newRecord);
      setRecords(prev => [savedRecord, ...prev]);
      
      const updatedRecords = [savedRecord, ...records];
      localStorage.setItem('symptomRecords', JSON.stringify(updatedRecords));

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
      await supabase.from('symptoms').delete().eq('id', id);
      const updatedRecords = records.filter(record => record.id !== id);
      setRecords(updatedRecords);
      localStorage.setItem('symptomRecords', JSON.stringify(updatedRecords));
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 간단 모드 폼
  const SimpleForm = () => (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '24px', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>빠른 기록</h1>
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
          <button
            onClick={() => setDetailMode(true)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#10B981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            상세모드
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

  // 상세 모드 폼
  const DetailedForm = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>상세 증상 기록</h1>
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
          <button
            onClick={() => setDetailMode(false)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#10B981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            간단모드
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ① 시각·상황 */}
        <div style={{ backgroundColor: '#EBF8FF', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1E40AF' }}>① 시각·상황</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>날짜</label>
              <input
                type="date"
                value={currentRecord.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>시간</label>
              <input
                type="time"
                value={currentRecord.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>당시 하고 있던 일</label>
              <input
                type="text"
                value={currentRecord.activity}
                onChange={(e) => handleInputChange('activity', e.target.value)}
                placeholder="집중 작업, 대화, 운동, 식사, 커피 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>많이 사용한 신체 부위</label>
              <input
                type="text"
                value={currentRecord.body_part}
                onChange={(e) => handleInputChange('body_part', e.target.value)}
                placeholder="어깨 근육, 거북목, 구부정한 자세 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>1시간 내 섭취한 음식·음료</label>
              <input
                type="text"
                value={currentRecord.intake}
                onChange={(e) => handleInputChange('intake', e.target.value)}
                placeholder="특히 카페인·알코올"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* ② 증상 시작 */}
        <div style={{ backgroundColor: '#FEF3C7', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#92400E' }}>② 증상 시작</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>증상 시작 순간의 느낌</label>
              <input
                type="text"
                value={currentRecord.start_feeling}
                onChange={(e) => handleInputChange('start_feeling', e.target.value)}
                placeholder="심장이 갑자기 빨라짐, 몸이 붕 뜨는 느낌, 땅으로 꺼지는 느낌"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>시작 양상</label>
              <select
                value={currentRecord.start_type}
                onChange={(e) => handleInputChange('start_type', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              >
                <option value="">선택하세요</option>
                <option value="갑작스러움">갑작스러움</option>
                <option value="서서히">서서히</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>전조 증상</label>
              <input
                type="text"
                value={currentRecord.premonition}
                onChange={(e) => handleInputChange('premonition', e.target.value)}
                placeholder="두통, 흉부 압박감, 시야 흐림 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* ③ 증상 진행 */}
        <div style={{ backgroundColor: '#FEE2E2', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#991B1B' }}>③ 증상 진행</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>두근거림 정도 (1-10)</label>
              <select
                value={currentRecord.heart_rate}
                onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
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
                type="text"
                value={currentRecord.sweating}
                onChange={(e) => handleInputChange('sweating', e.target.value)}
                placeholder="이마, 등, 손바닥 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>호흡 곤란 정도 (1-10)</label>
              <select
                value={currentRecord.breathing}
                onChange={(e) => handleInputChange('breathing', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
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
                value={currentRecord.dizziness}
                onChange={(e) => handleInputChange('dizziness', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
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
                value={currentRecord.weakness}
                onChange={(e) => handleInputChange('weakness', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
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
                value={currentRecord.speech_difficulty}
                onChange={(e) => handleInputChange('speech_difficulty', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
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
                type="text"
                value={currentRecord.chest_pain}
                onChange={(e) => handleInputChange('chest_pain', e.target.value)}
                placeholder="위치, 정도, 특징 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* ④ 객관적 수치 */}
        <div style={{ backgroundColor: '#ECFDF5', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#065F46' }}>④ 객관적 수치</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>심박수 (bpm)</label>
              <input
                type="number"
                value={currentRecord.measured_heart_rate}
                onChange={(e) => handleInputChange('measured_heart_rate', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>심전도 기록</label>
              <select
                value={currentRecord.ecg_taken}
                onChange={(e) => handleInputChange('ecg_taken', e.target.value === 'true')}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              >
                <option value="false">아니오</option>
                <option value="true">예</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>혈압</label>
              <input
                type="text"
                value={currentRecord.blood_pressure}
                onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
                placeholder="예: 120/80"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>혈당</label>
              <input
                type="text"
                value={currentRecord.blood_sugar}
                onChange={(e) => handleInputChange('blood_sugar', e.target.value)}
                placeholder="예: 90 mg/dL"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* ⑤ 지속 시간 및 종료 후 상태 */}
        <div style={{ backgroundColor: '#F3E8FF', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#6B21A8' }}>⑤ 지속 시간 및 종료 후 상태</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>증상 지속 시간 (분)</label>
              <input
                type="number"
                value={currentRecord.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>종료 후 남은 불편감</label>
              <input
                type="text"
                value={currentRecord.after_effects}
                onChange={(e) => handleInputChange('after_effects', e.target.value)}
                placeholder="피로, 무기력, 두통 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>회복 후 심박수</label>
              <input
                type="number"
                value={currentRecord.recovery_heart_rate}
                onChange={(e) => handleInputChange('recovery_heart_rate', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>회복 후 혈압</label>
              <input
                type="text"
                value={currentRecord.recovery_blood_pressure}
                onChange={(e) => handleInputChange('recovery_blood_pressure', e.target.value)}
                placeholder="예: 120/80"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>회복을 위해 시도한 행동</label>
              <input
                type="text"
                value={currentRecord.recovery_actions}
                onChange={(e) => handleInputChange('recovery_actions', e.target.value)}
                placeholder="간식이나 음료 섭취, 자리에 눕기, 눈 감기 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>해당 행동이 회복에 도움되었나요?</label>
              <select
                value={currentRecord.recovery_helpful}
                onChange={(e) => handleInputChange('recovery_helpful', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
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
        <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>⑥ 기타 참고</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>최근 며칠간 수면 시간</label>
              <input
                type="text"
                value={currentRecord.sleep_hours}
                onChange={(e) => handleInputChange('sleep_hours', e.target.value)}
                placeholder="예: 5-6시간"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>스트레스 상황 여부</label>
              <input
                type="text"
                value={currentRecord.stress}
                onChange={(e) => handleInputChange('stress', e.target.value)}
                placeholder="업무, 인간관계, 건강 등"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>최근 복용 약물</label>
              <input
                type="text"
                value={currentRecord.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="약물명, 용량, 복용 시간"
                style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>추가 메모</label>
              <textarea
                value={currentRecord.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="기타 특이사항이나 중요하다고 생각되는 내용"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '4px',
                  height: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ 
            padding: '16px 32px', 
            backgroundColor: '#3B82F6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: saving ? 0.5 : 1
          }}
        >
          {saving ? '저장 중...' : '기록 저장'}
        </button>
      </div>
    </div>
  );

  if (showForm) {
    return detailMode ? <DetailedForm /> : <SimpleForm />;
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
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>증상 기록 관리</h1>
        <p style={{ color: '#6B7280' }}>체계적인 증상 기록으로 패턴을 파악하고 의료진과 효과적으로 소통하세요.</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
            <span style={{ fontSize: '16px' }}>📶</span>
            <span style={{ fontSize: '14px' }}>온라인 - 클라우드 동기화 활성</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setDetailMode(false);
            setShowForm(true);
          }}
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
        <button
          onClick={() => {
            setDetailMode(true);
            setShowForm(true);
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            backgroundColor: '#10B981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📋 상세 기록
        </button>
      </div>

      {/* PWA 설치 안내 */}
      <div style={{ 
        background: 'linear-gradient(to right, #EBF8FF, #F3E8FF)', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '24px',
        border: '1px solid #BFDBFE'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📱</span>
          <div>
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>앱처럼 사용하기</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              브라우저 메뉴에서 "홈 화면에 추가"를 선택하면 스마트폰 앱처럼 사용할 수 있습니다.
            </p>
          </div>
        </div>
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
              backgroundColor: '#F9FAFB',
              transition: 'background-color 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {record.date} {record.time}
                    {record.synced === false && (
                      <span style={{ 
                        fontSize: '12px', 
                        backgroundColor: '#FED7AA', 
                        color: '#EA580C', 
                        padding: '2px 8px', 
                        borderRadius: '12px' 
                      }}>
                        동기화 대기
                      </span>
                    )}
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
