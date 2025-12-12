module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Quan Ly Phong Tro API',
    version: '1.0.0',
    description: 'API quan ly phong tro voi xac thuc JWT, SQLite, Swagger UI',
  },
  servers: [{ url: '/api' }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Rooms' },
    { name: 'Tenants' },
    { name: 'TenantApproval' },
    { name: 'RoomTenant' },
    { name: 'MeterReadings' },
    { name: 'Invoices' },
    { name: 'Reports' },
    { name: 'Settings' },
    { name: 'Notifications' },
    { name: 'Payments' },
    { name: 'VNPay' },
    { name: 'MoMo' },
  ],
  paths: {
    '/health': {
      get: { summary: 'Health check', tags: ['Health'], security: [], responses: { '200': { description: 'OK' } } },
    },

    // Auth
    '/auth/register-manager': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Dang ky quan ly (seed nhanh)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, name: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'password'] } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/auth/register-tenant': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Dang ky khach thue',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', description: 'Ten dang nhap (bat buoc)' },
                  name: { type: 'string', description: 'Ho va ten (bat buoc)' },
                  password: { type: 'string', description: 'Mat khau (bat buoc, toi thieu 6 ky tu)' },
                  phone: { type: 'string', description: 'So dien thoai (optional)' },
                  email: { type: 'string', format: 'email', description: 'Email (optional)' },
                  diaChi: { type: 'string', description: 'Dia chi (optional)' },
                  ngaySinh: { type: 'string', format: 'date', description: 'Ngay sinh (optional, format: YYYY-MM-DD)' },
                  gioiTinh: { type: 'string', enum: ['NAM', 'NU', 'KHAC'], description: 'Gioi tinh (optional)' },
                  cccd: { type: 'string', description: 'So CCCD (optional)' }
                },
                required: ['username', 'name', 'password']
              }
            }
          }
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Dang nhap',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'password'] } } },
        },
        responses: { '200': { description: 'OK' } },
      },
    },

    // Users
    '/users/me': {
      get: { tags: ['Users'], summary: 'Lay profile', responses: { '200': { description: 'OK' } } },
      patch: { tags: ['Users'], summary: 'Cap nhat profile', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, expoPushToken: { type: 'string' } } } } } }, responses: { '200': { description: 'OK' } } },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Danh sach tat ca users (admin)',
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['MANAGER', 'TENANT'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'PENDING', 'REJECTED', 'DELETED'] } },
          { name: 'includeDeleted', in: 'query', schema: { type: 'string', enum: ['true', 'false'], default: 'false' }, description: 'Co include users da bi xoa' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Lay thong tin user theo ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Cap nhat thong tin user (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string', description: 'Mat khau (toi thieu 6 ky tu)' },
                  status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'REJECTED', 'DELETED'] }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Xoa user (soft delete - set status DELETED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
      },
    },
    '/users/{userId}/tenant': {
      patch: {
        tags: ['Users'],
        summary: 'Cap nhat thong tin tenant (admin)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  hoTen: { type: 'string' },
                  soDienThoai: { type: 'string' },
                  cccd: { type: 'string' },
                  email: { type: 'string' },
                  diaChi: { type: 'string' },
                  ngaySinh: { type: 'string', format: 'date' },
                  gioiTinh: { type: 'string', enum: ['NAM', 'NU', 'KHAC'] }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
      },
    },

    // Rooms
    '/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Danh sach phong',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['TRONG', 'CO_KHACH'] } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } } },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Tao phong',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/rooms/{id}': {
      get: { tags: ['Rooms'], summary: 'Chi tiet phong', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
      patch: { tags: ['Rooms'], summary: 'Cap nhat phong', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } }, responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Rooms'], summary: 'Xoa phong', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
    },
    '/rooms/me/tenant': {
      get: {
        tags: ['Rooms'],
        summary: 'Lay phong cua tenant hien tai',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } } },
      },
    },

    // Tenants
    '/tenants': {
      get: {
        tags: ['Tenants'],
        summary: 'Danh sach khach thue',
        parameters: [{ name: 'query', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Tenants'],
        summary: 'Tao khach thue',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/tenants/{id}': {
      get: { tags: ['Tenants'], summary: 'Chi tiet khach thue', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
      patch: { tags: ['Tenants'], summary: 'Cap nhat khach thue', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Tenant' } } } }, responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Tenants'], summary: 'Xoa khach thue', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },
    '/tenants/{id}/assign-room': {
      post: { tags: ['Tenants'], summary: 'Gan phong cho khach thue', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { roomId: { type: 'integer' } }, required: ['roomId'] } } } }, responses: { '200': { description: 'OK' } } },
    },
    '/tenants/{id}/return-room': {
      post: { tags: ['Tenants'], summary: 'Tra phong cho khach thue', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },

    // Tenant Approval
    '/tenant-approval/pending': {
      get: { tags: ['TenantApproval'], summary: 'Danh sach tenant cho duyet', responses: { '200': { description: 'OK' } } },
    },
    '/tenant-approval/stats': {
      get: { tags: ['TenantApproval'], summary: 'Thong ke duyet tenant', responses: { '200': { description: 'OK' } } },
    },
    '/tenant-approval/{userId}/approve': {
      post: { tags: ['TenantApproval'], summary: 'Duyet tenant', parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },
    '/tenant-approval/{userId}/reject': {
      post: { tags: ['TenantApproval'], summary: 'Tu choi tenant', parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // RoomTenant
    '/rooms/{roomId}/assign-tenant': {
      post: {
        tags: ['RoomTenant'],
        summary: 'Gan khach vao phong',
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
        summary: 'Tra phong (ghi ngay ra)',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { tenantId: { type: 'integer' }, ngayRa: { type: 'string' } }, required: ['tenantId'] } } } },
        responses: { '200': { description: 'OK' } },
      },
    },

    // Meter Readings
    '/meter-readings': {
      get: {
        tags: ['MeterReadings'],
        summary: 'Danh sach chi so dien nuoc',
        parameters: [
          { name: 'roomId', in: 'query', schema: { type: 'integer' } },
          { name: 'ky', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['MeterReadings'],
        summary: 'Nhap chi so ky',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { roomId: { type: 'integer' }, ky: { type: 'string' }, dienSoMoi: { type: 'number' }, nuocSoMoi: { type: 'number' } }, required: ['roomId', 'ky', 'dienSoMoi', 'nuocSoMoi'] } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/meter-readings/{id}': {
      patch: { tags: ['MeterReadings'], summary: 'Cap nhat chi so (neu chua khoa)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { dienSoMoi: { type: 'number' }, nuocSoMoi: { type: 'number' } } } } } }, responses: { '200': { description: 'OK' } } },
    },
    '/meter-readings/{id}/lock': {
      post: { tags: ['MeterReadings'], summary: 'Khoa chi so', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' } } },
    },
    '/meter-readings/latest/{roomId}': {
      get: {
        tags: ['MeterReadings'],
        summary: 'Lay chi so gan nhat cua phong',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' } },
      },
    },

    // Invoices
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'Danh sach hoa don (admin)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PAID', 'UNPAID', 'PENDING'] } },
          { name: 'ky', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
      },
    },
    '/invoices/me': {
      get: {
        tags: ['Invoices'],
        summary: 'Danh sach hoa don cua tenant hien tai',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PAID', 'UNPAID', 'PENDING'] } },
          { name: 'ky', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/invoices/{id}': {
      get: { tags: ['Invoices'], summary: 'Chi tiet hoa don', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
    },
    '/invoices/{id}/request-payment': {
      post: { tags: ['Invoices'], summary: 'Tenant yeu cau xac nhan thanh toan', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '400': { description: 'Already paid' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } } },
    },
    '/invoices/{id}/pay': {
      patch: { tags: ['Invoices'], summary: 'Danh dau da thanh toan (admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
    },

    // Reports
    '/reports/revenue': {
      get: { tags: ['Reports'], summary: 'Tong thu', parameters: [{ name: 'from', in: 'query', schema: { type: 'string' } }, { name: 'to', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
    },
    '/reports/rooms/summary': {
      get: { tags: ['Reports'], summary: 'Tom tat phong trong/dang co khach', responses: { '200': { description: 'OK' } } },
    },

    // Settings
    '/settings': {
      get: { tags: ['Settings'], summary: 'Lay cau hinh', responses: { '200': { description: 'OK' } } },
      patch: { tags: ['Settings'], summary: 'Cap nhat cau hinh', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'string' } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // Notifications
    '/notifications/test': {
      post: { tags: ['Notifications'], summary: 'Gui thong bao test (gia lap)', requestBody: { required: false, content: { 'application/json': { schema: { type: 'object', properties: { to: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } } } } } }, responses: { '200': { description: 'OK' } } },
    },

    // Payments (listing & stats)
    '/payments': {
      get: {
        tags: ['Payments'],
        summary: 'Danh sach giao dich (admin)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'] } },
          { name: 'paymentMethod', in: 'query', schema: { type: 'string', enum: ['VNPAY', 'MOMO', 'CASH'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
      },
    },
    '/payments/stats': {
      get: { tags: ['Payments'], summary: 'Thong ke giao dich (admin)', responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } } },
    },
    '/payments/invoice/{invoiceId}': {
      get: {
        tags: ['Payments'],
        summary: 'Payments cua mot hoa don (admin/tenant)',
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' }, '404': { description: 'Invoice not found' } },
      },
    },
    '/payments/tenant/me': {
      get: { tags: ['Payments'], summary: 'Payments cua tenant hien tai', responses: { '200': { description: 'OK' }, '404': { description: 'Tenant not found' } } },
    },
    '/payments/tenant/{tenantId}': {
      get: {
        tags: ['Payments'],
        summary: 'Payments cua mot tenant (admin)',
        parameters: [
          { name: 'tenantId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' }, '404': { description: 'Tenant not found' } },
      },
    },
    '/payments/transaction/{transactionId}': {
      get: {
        tags: ['Payments'],
        summary: 'Chi tiet giao dich theo transactionId',
        parameters: [{ name: 'transactionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Transaction not found' } },
      },
    },

    // VNPay
    '/vnpay/create': {
      post: {
        tags: ['VNPay'],
        summary: 'Tao link thanh toan VNPay',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  invoiceId: { type: 'integer', description: 'ID hoa don can thanh toan' },
                  bankCode: { type: 'string', description: 'Ma ngan hang (optional)' },
                },
                required: ['invoiceId'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, transactionId: { type: 'string' }, paymentUrl: { type: 'string' } } } } } },
          '400': { description: 'Bad request / invoice paid' },
          '404': { description: 'Invoice not found' },
        },
      },
    },
    '/vnpay/status/{invoiceId}': {
      get: {
        tags: ['VNPay'],
        summary: 'Kiem tra trang thai thanh toan VNPay',
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Invoice not found' } },
      },
    },
    '/vnpay/callback': {
      get: {
        tags: ['VNPay'],
        security: [],
        summary: 'VNPay callback (IPN)',
        description: 'VNPay goi khi nguoi dung hoan tat thanh toan',
        responses: { '200': { description: 'Redirect to return URL' } },
      },
    },

    // MoMo
    '/momo/create': {
      post: {
        tags: ['MoMo'],
        summary: 'Tao link thanh toan MoMo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { invoiceId: { type: 'integer', description: 'ID hoa don can thanh toan' } },
                required: ['invoiceId'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, orderId: { type: 'string' }, paymentUrl: { type: 'string' }, deeplink: { type: 'string' }, qrCodeUrl: { type: 'string' } } } } } },
          '400': { description: 'Bad request / invoice paid' },
          '404': { description: 'Invoice not found' },
        },
      },
    },
    '/momo/status/{invoiceId}': {
      get: {
        tags: ['MoMo'],
        summary: 'Kiem tra trang thai thanh toan MoMo',
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Invoice not found' } },
      },
    },
    '/momo/return': {
      get: {
        tags: ['MoMo'],
        security: [],
        summary: 'MoMo return (redirect sau thanh toan)',
        responses: { '200': { description: 'Redirect to return URL' } },
      },
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
          email: { type: 'string' },
          diaChi: { type: 'string' },
          ngaySinh: { type: 'string' },
          gioiTinh: { type: 'string', enum: ['NAM', 'NU', 'KHAC'] },
          userId: { type: 'integer' },
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
          tenantId: { type: 'integer' },
          ky: { type: 'string' },
          tienPhong: { type: 'number' },
          dienTieuThu: { type: 'number' },
          nuocTieuThu: { type: 'number' },
          donGiaDien: { type: 'number' },
          donGiaNuoc: { type: 'number' },
          phuPhi: { type: 'number' },
          tongCong: { type: 'number' },
          status: { type: 'string', enum: ['PAID', 'UNPAID', 'PENDING'] },
          createdAt: { type: 'string' },
          paidAt: { type: 'string' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          invoiceId: { type: 'integer' },
          tenantId: { type: 'integer' },
          transactionId: { type: 'string' },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'] },
          paymentMethod: { type: 'string', enum: ['VNPAY', 'MOMO', 'CASH'] },
          responseCode: { type: 'string' },
          paidAt: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    },
  },
};