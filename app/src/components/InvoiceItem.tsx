import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Invoice, Room } from '../types';

interface InvoiceItemProps {
  item: Invoice;
  room?: Room;
  userRole?: string;
  onPress: () => void;
  onPayment: (invoice: Invoice) => void;
}

export const InvoiceItem: React.FC<InvoiceItemProps> = ({
  item,
  room,
  userRole,
  onPress,
  onPayment,
}) => {
  return (
    <TouchableOpacity style={styles.invoiceCard} onPress={onPress}>
      <View style={styles.invoiceHeader}>
        <Text style={styles.roomCode}>{room?.maPhong || "N/A"}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "PAID"
                  ? "#34C759"
                  : item.status === "PENDING"
                  ? "#FFA500"
                  : "#FF3B30",
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "PAID"
              ? "Đã thanh toán"
              : item.status === "PENDING"
              ? "Chờ xác nhận"
              : "Chưa thanh toán"}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kỳ:</Text>
          <Text style={styles.infoValue}>{item.ky}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tiền phòng:</Text>
          <Text style={styles.infoValue}>
            {item.tienPhong.toLocaleString()}đ
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Điện ({item.dienTieuThu} kWh):</Text>
          <Text style={styles.infoValue}>
            {(item.dienTieuThu * item.donGiaDien).toLocaleString()}đ
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nước ({item.nuocTieuThu} m³):</Text>
          <Text style={styles.infoValue}>
            {(item.nuocTieuThu * item.donGiaNuoc).toLocaleString()}đ
          </Text>
        </View>

        <View style={[styles.infoRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>
            {item.tongCong.toLocaleString()}đ
          </Text>
        </View>
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Xem</Text>
        </TouchableOpacity>

        {userRole === "TENANT" && item.status === "UNPAID" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.vnpayButton]}
            onPress={() => onPayment(item)}
          >
            <Ionicons name="card-outline" size={20} color="white" />
            <Text style={[styles.actionText, styles.vnpayButtonText]}>
              Thanh toán
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  invoiceCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roomCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  invoiceInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
  },
  invoiceActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
  },
  vnpayButton: {
    backgroundColor: "#007AFF",
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  vnpayButtonText: {
    color: "white",
  },
});
