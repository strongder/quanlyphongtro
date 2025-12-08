// Minimal OpenAPI spec. We will add paths inline within routers using comments,
// but expose a reasonably complete spec for Swagger UI.

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Quan Ly Phong Tro API',
    version: '1.0.0',
    description: 'API không bảo mật (MVP học tập) với SQLite, Swagger UI',
  },
  servers: [{ url: '/api' }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Rooms' },
    { name: 'Tenants' },
    { name: 'RoomTenant' },
    { name: 'MeterReadings' },
    { name: 'Invoices' },
    { name: 'Reports' },
    { name: 'Settings' },
    { name: 'Notifications' },
  ],
  paths: {
    '/health': {
      get: { summary: 'Health check', tags: ['Health'], responses: { '200': { description: 'OK' } } },
    },

    // Auth
    '/auth/register-manager': {
      post: { tags: ['Auth'], summary: 'Đăng ký quản lý (seed nhanh)', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'password'] } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/auth/register-tenant': {
      post: { tags: ['Auth'], summary: 'Đăng ký khách thuê', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'name', 'password'] } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Đăng nhập', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'password'] } } } }, responses: { '200': { description: 'OK' } } },
    },

    // Users
    '/users/me': {
      get: { tags: ['Users'], summary: 'Lấy profile', responses: { '200': { description: 'OK' } } },
      patch: { tags: ['Users'], summary: 'Cập nhật profile', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, expoPushToken: { type: 'string' } } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // Rooms
    '/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Danh sách phòng',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['TRONG', 'CO_KHACH'] } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } } },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Tạo phòng',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/rooms/{id}': {
      get: { tags: ['Rooms'], summary: 'Chi tiết phòng', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
      patch: { tags: ['Rooms'], summary: 'Cập nhật phòng', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } }, responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Rooms'], summary: 'Xóa phòng', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
    },
    //rooms/me
    '/rooms/me/tenant': {
      get: {
        tags: ['Rooms'],
        summary: 'Lấy phòng của tenant hiện tại',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } } },
      },
    },

    // Tenants
    '/tenants': {
      get: {
        tags: ['Tenants'],
        summary: 'Danh sách khách thuê',
        parameters: [{ name: 'query', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Tenants'],
        summary: 'Tạo khách thuê',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/tenants/{id}': {
      get: { tags: ['Tenants'], summary: 'Chi tiết khách thuê', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
      patch: { tags: ['Tenants'], summary: 'Cập nhật khách thuê', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } }, responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Tenants'], summary: 'Xóa khách thuê', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },
    '/tenants/{id}/assign-room': {
      post: { tags: ['Tenants'], summary: 'Gán phòng cho khách thuê', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { roomId: { type: 'integer' } }, required: ['roomId'] } } } }, responses: { '200': { description: 'OK' } } },
    },
    '/tenants/{id}/return-room': {
      post: { tags: ['Tenants'], summary: 'Trả phòng cho khách thuê', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },

    // Tenant Approval
    '/tenant-approval/pending': {
      get: { tags: ['TenantApproval'], summary: 'Danh sách tenant chờ duyệt', responses: { '200': { description: 'OK' } } },
    },
    '/tenant-approval/stats': {
      get: { tags: ['TenantApproval'], summary: 'Thống kê duyệt tenant', responses: { '200': { description: 'OK' } } },
    },
    '/tenant-approval/{userId}/approve': {
      post: { tags: ['TenantApproval'], summary: 'Duyệt tenant', parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },
    '/tenant-approval/{userId}/reject': {
      post: { tags: ['TenantApproval'], summary: 'Từ chối tenant', parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // RoomTenant
    '/rooms/{roomId}/assign-tenant': {
      post: {
        tags: ['RoomTenant'],
        summary: 'Gán khách vào phòng',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { tenantId: { type: 'integer' }, ngayVao: { type: 'string' }, isPrimaryTenant: { type: 'boolean' } }, required: ['tenantId'] } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/rooms/{roomId}/release-tenant': {
      post: {
        tags: ['RoomTenant'],
        summary: 'Trả phòng (ghi ngày ra)',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { tenantId: { type: 'integer' }, ngayRa: { type: 'string' } }, required: ['tenantId'] } } } },
        responses: { '200': { description: 'OK' } },
      },
    },

    // Meter Readings
    '/meter-readings': {
      get: {
        tags: ['MeterReadings'],
        summary: 'Danh sách chỉ số điện nước',
        parameters: [
          { name: 'roomId', in: 'query', schema: { type: 'integer' } },
          { name: 'ky', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['MeterReadings'],
        summary: 'Nhập chỉ số kỳ',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { roomId: { type: 'integer' }, ky: { type: 'string' }, dienSoMoi: { type: 'number' }, nuocSoMoi: { type: 'number' } }, required: ['roomId', 'ky', 'dienSoMoi', 'nuocSoMoi'] } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/meter-readings/{id}': {
      patch: { tags: ['MeterReadings'], summary: 'Cập nhật chỉ số (nếu chưa khóa)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { dienSoMoi: { type: 'number' }, nuocSoMoi: { type: 'number' } } } } } }, responses: { '200': { description: 'OK' } } },
    },
    '/meter-readings/{id}/lock': {
      post: { tags: ['MeterReadings'], summary: 'Khóa chỉ số', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },
    '/meter-readings/latest/{roomId}': {
      get: {
        tags: ['MeterReadings'],
        summary: 'Lấy chỉ số gần nhất của phòng',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' } },
      },
    },

    // Invoices
    // '/invoices/generate': {
    //   post: {
    //     tags: ['Invoices'],
    //     summary: 'Tạo hóa đơn hàng loạt theo kỳ',
    //     requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { ky: { type: 'string' } }, required: ['ky'] } } } },
    //     responses: { '200': { description: 'OK' } },
    //   },
    // },
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'Danh sách hóa đơn',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PAID', 'UNPAID'] } },
          { name: 'ky', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/invoices/me': {
      get: {
        tags: ['Invoices'],
        summary: 'Danh sách hóa đơn của tenant hiện tại',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PAID', 'UNPAID'] } },
          { name: 'ky', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/invoices/{id}': {
      get: { tags: ['Invoices'], summary: 'Chi tiết hóa đơn', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
    },
    '/invoices/{id}/pay': {
      patch: { tags: ['Invoices'], summary: 'Đánh dấu đã thanh toán', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
    },

    // Reports
    '/reports/revenue': {
      get: { tags: ['Reports'], summary: 'Tổng thu', parameters: [{ name: 'from', in: 'query', schema: { type: 'string' } }, { name: 'to', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/reports/rooms/summary': {
      get: { tags: ['Reports'], summary: 'Tóm tắt phòng trống/đang có khách', responses: { '200': { description: 'OK' } } },
    },

    // Settings
    '/settings': {
      get: { tags: ['Settings'], summary: 'Lấy cấu hình', responses: { '200': { description: 'OK' } } },
      patch: { tags: ['Settings'], summary: 'Cập nhật cấu hình', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'string' } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // Notifications
    '/notifications/test': {
      post: { tags: ['Notifications'], summary: 'Gửi thông báo test (giả lập)', requestBody: { required: false, content: { 'application/json': { schema: { type: 'object', properties: { to: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // Payments
    '/payments/vnpay/create': {
      post: {
        tags: ['Payments'],
        summary: 'Tạo link thanh toán VNPay',
        description: 'Tạo giao dịch thanh toán VNPay cho hóa đơn',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  invoiceId: { type: 'integer', description: 'ID của hóa đơn cần thanh toán' },
                  bankCode: { type: 'string', description: 'Mã ngân hàng (optional)' }
                },
                required: ['invoiceId']
              }
            }
          }
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, transactionId: { type: 'string' }, paymentUrl: { type: 'string' } } } } } },
          '400': { description: 'Bad request' },
          '404': { description: 'Invoice not found' }
        }
      }
    },
    '/payments/vnpay/callback': {
      get: {
        tags: ['Payments'],
        summary: 'VNPay callback (IPN)',
        description: 'Endpoint nhận callback từ VNPay khi khách thanh toán',
        responses: {
          '200': { description: 'OK' }
        }
      }
    },
    '/payments/vnpay/status/{invoiceId}': {
      get: {
        tags: ['Payments'],
        summary: 'Kiểm tra trạng thái thanh toán',
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'OK' },
          '404': { description: 'Invoice not found' }
        }
      }
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Room: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          maPhong: { type: 'string' },
          giaThue: { type: 'number' },
          trangThai: { type: 'string', enum: ['TRONG', 'CO_KHACH'] },
          note: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          hoTen: { type: 'string' },
          soDienThoai: { type: 'string' },
          cccd: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      MeterReading: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          roomId: { type: 'integer' },
          ky: { type: 'string' },
          dienSoCu: { type: 'number' },
          dienSoMoi: { type: 'number' },
          nuocSoCu: { type: 'number' },
          nuocSoMoi: { type: 'number' },
          locked: { type: 'integer' },
          createdAt: { type: 'string' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          roomId: { type: 'integer' },
          ky: { type: 'string' },
          tienPhong: { type: 'number' },
          dienTieuThu: { type: 'number' },
          nuocTieuThu: { type: 'number' },
          donGiaDien: { type: 'number' },
          donGiaNuoc: { type: 'number' },
          phuPhi: { type: 'number' },
          tongCong: { type: 'number' },
          status: { type: 'string', enum: ['PAID', 'UNPAID'] },
          createdAt: { type: 'string' },
          paidAt: { type: 'string' },
        },
      },
    },
  },
};


