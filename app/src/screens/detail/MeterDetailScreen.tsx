import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MeterReading, Room } from '../../types';
import { meterService } from '../../services/api';

const MeterDetailScreen = ({ route, navigation }: any) => {
  const { reading, room } = route.params || {};
  const [meterReading, setMeterReading] = useState<MeterReading | null>(reading || null);
  const [roomInfo] = useState<Room | null>(room || null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    dienSoCu: '',
    dienSoMoi: '',
    nuocSoCu: '',
    nuocSoMoi: '',
  });

  useEffect(() => {
    if (!reading || !room) {
      navigation.goBack();
      return;
    }
    setForm({
      dienSoCu: String(reading.dienSoCu ?? ''),
      dienSoMoi: String(reading.dienSoMoi ?? ''),
      nuocSoCu: String(reading.nuocSoCu ?? ''),
      nuocSoMoi: String(reading.nuocSoMoi ?? ''),
    });
  }, [reading, room]);

  if (!meterReading || !roomInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết chỉ số</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Không tìm thấy dữ liệu</Text>
        </View>
      </View>
    );
  }

  const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('vi-VN') : '0');
  const dienTieuThu = Math.max(0, (meterReading.dienSoMoi || 0) - (meterReading.dienSoCu || 0));
  const nuocTieuThu = Math.max(0, (meterReading.nuocSoMoi || 0) - (meterReading.nuocSoCu || 0));

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        dienSoCu: parseInt(form.dienSoCu || '0', 10),
        dienSoMoi: parseInt(form.dienSoMoi || '0', 10),
        nuocSoCu: parseInt(form.nuocSoCu || '0', 10),
        nuocSoMoi: parseInt(form.nuocSoMoi || '0', 10),
      };
      const updated = await meterService.updateMeterReading(meterReading.id, payload);
      setMeterReading(updated);
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật chỉ số');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật chỉ số');
    } finally {
      setSaving(false);
    }
  };

  const onLock = async () => {
    try {
      setSaving(true);
      const updated = await meterService.lockMeterReading(meterReading.id);
      setMeterReading(updated);
      Alert.alert('Thành công', 'Đã khóa chỉ số');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể khóa chỉ số');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết chỉ số</Text>
        {!meterReading.locked && (
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
            <Ionicons name={isEditing ? 'close' : 'create-outline'} size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phòng</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Mã phòng:</Text><Text style={styles.infoValue}>{roomInfo.maPhong}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Giá thuê:</Text><Text style={styles.infoValue}>{`${fmt(roomInfo.giaThue)}đ/tháng`}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Kỳ:</Text><Text style={styles.infoValue}>{meterReading.ky}</Text></View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.statusDot} />
                <Text style={styles.infoValue}>{meterReading.locked ? 'Đã khóa' : 'Chưa khóa'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số điện</Text>
          <View style={styles.meterCard}>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số cũ:</Text>
              {isEditing ? (
                <TextInput style={styles.input} keyboardType="numeric" value={form.dienSoCu} onChangeText={(t) => setForm({ ...form, dienSoCu: t.replace(/[^0-9]/g, '') })} placeholder="Nhập số cũ" />
              ) : (
                <Text style={styles.meterValue}>{`${fmt(meterReading.dienSoCu || 0)} kWh`}</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số mới:</Text>
              {isEditing ? (
                <TextInput style={styles.input} keyboardType="numeric" value={form.dienSoMoi} onChangeText={(t) => setForm({ ...form, dienSoMoi: t.replace(/[^0-9]/g, '') })} placeholder="Nhập số mới" />
              ) : (
                <Text style={styles.meterValue}>{`${fmt(meterReading.dienSoMoi || 0)} kWh`}</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Tiêu thụ:</Text>
              <Text style={[styles.meterValue, styles.consumptionValue]}>{`${fmt(dienTieuThu)} kWh`}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số nước</Text>
          <View style={styles.meterCard}>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số cũ:</Text>
              {isEditing ? (
                <TextInput style={styles.input} keyboardType="numeric" value={form.nuocSoCu} onChangeText={(t) => setForm({ ...form, nuocSoCu: t.replace(/[^0-9]/g, '') })} placeholder="Nhập số cũ" />
              ) : (
                <Text style={styles.meterValue}>{`${fmt(meterReading.nuocSoCu || 0)} m³`}</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số mới:</Text>
              {isEditing ? (
                <TextInput style={styles.input} keyboardType="numeric" value={form.nuocSoMoi} onChangeText={(t) => setForm({ ...form, nuocSoMoi: t.replace(/[^0-9]/g, '') })} placeholder="Nhập số mới" />
              ) : (
                <Text style={styles.meterValue}>{`${fmt(meterReading.nuocSoMoi || 0)} m³`}</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Tiêu thụ:</Text>
              <Text style={[styles.meterValue, styles.consumptionValue]}>{`${fmt(nuocTieuThu)} m³`}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Ngày tạo:</Text><Text style={styles.infoValue}>{new Date(meterReading.createdAt).toLocaleString('vi-VN')}</Text></View>
            {meterReading.locked ? (
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Ngày khóa:</Text><Text style={styles.infoValue}>{new Date(meterReading.createdAt).toLocaleString('vi-VN')}</Text></View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {!meterReading.locked && (
        <View style={styles.actionBar}>
          {isEditing ? (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.cancel]} onPress={() => setIsEditing(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.save]} onPress={onSave} disabled={saving}>
                <Text style={styles.btnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.lock]} onPress={onLock} disabled={saving}>
              <Text style={styles.btnText}>{saving ? 'Đang khóa...' : 'Khóa chỉ số'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  meterCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  meterLabel: {
    fontSize: 16,
    color: '#666',
  },
  meterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  consumptionValue: {
    color: '#007AFF',
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minWidth: 120,
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  lockButton: {
    backgroundColor: '#FF9500',
  },
  lockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 16,
  },
});

export default MeterDetailScreen;