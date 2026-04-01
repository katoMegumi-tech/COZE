# Swagger 集成指南

## 访问地址

启动项目后，可以通过以下地址访问 Swagger UI:

- **Swagger UI**: http://localhost:8088/swagger-ui.html
- **API 文档**: http://localhost:8088/v3/api-docs

## 功能说明

### 1. JWT 认证

本系统已配置 JWT Bearer Token 认证，在 Swagger UI 中:

1. 点击右上角的 **Authorize** 按钮
2. 在 Value 中输入：`Bearer {your_token}` (例如：`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. 点击 **Authorize** 确认
4. 现在所有接口都会自动携带 JWT Token

### 2. 接口分组

API 接口按功能分组显示:

- **用户管理**: 用户登录、注册、信息管理等接口
- **文案生成**: AI 文案生成相关接口
- **Coze 工作流**: 视频生成工作流相关接口
- **文件上传**: 文件上传到 Coze 平台接口

### 3. 在线测试

每个接口都支持在线测试:

1. 展开接口详情
2. 点击 **Try it out** 按钮
3. 填写请求参数
4. 点击 **Execute** 执行请求
5. 查看响应结果

## 配置说明

### application.yml 配置

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
    operations-sorter: method  # 按 HTTP 方法排序
    tags-sorter: alpha         # 按字母顺序排序标签
    try-it-out-enabled: true   # 启用在线测试
```

### 添加 Swagger 注解

#### Controller 层

```java
@Tag(name = "模块名称", description = "模块描述")
@RestController
@RequestMapping("/api/xxx")
public class XxxController {
    
    @Operation(summary = "接口摘要", description = "详细描述")
    @PostMapping("/endpoint")
    public Result<XxxResponse> method(@RequestBody XxxRequest request) {
        // ...
    }
}
```

#### DTO 层

```java
@Schema(description = "请求/响应参数说明")
@Data
public class XxxDTO {
    
    @Schema(description = "字段说明", required = true, example = "示例值")
    private String field;
}
```

## 已集成的接口

### 用户管理模块
- ✅ POST /api/admin/user/login - 用户登录
- ✅ POST /api/admin/user/register - 用户注册
- ✅ POST /api/admin/user/getUserByUsername - 获取用户信息
- ✅ POST /api/admin/user/logout - 用户登出
- ✅ POST /api/admin/user/checkUsernameExists - 检查用户名是否存在
- ✅ POST /api/admin/user/updateUser - 修改用户信息

### 文案生成模块
- ✅ POST /api/copywriting/generate - 生成文案（同步）
- ✅ POST /api/copywriting/generate-async - 异步生成文案
- ✅ GET /api/copywriting/task-status/{taskId} - 查询任务状态

### Coze 工作流模块
- ✅ POST /api/coze/workflow/async - 异步生成视频
- ✅ GET /api/coze/workflow/status/{taskId} - 查询任务状态

### 文件上传模块
- ✅ POST /api/upload/coze - 上传文件到 Coze

## 注意事项

1. 需要认证的接口请先进行 JWT 认证
2. 请求参数中的必填字段已标注 `required = true`
3. 所有示例值仅供参考，请根据实际情况调整
4. 文件上传接口支持最大 512MB 的文件

## 开发建议

为新的 Controller 添加 Swagger 注解的步骤:

1. 在 Controller 类上添加 `@Tag` 注解
2. 在每个接口方法上添加 `@Operation` 注解
3. 在 Request/Response DTO 类上添加 `@Schema` 注解
4. 在 DTO 字段上添加 `@Schema` 注解，包含 description、example 等信息

参考现有代码中的注解使用方式即可。
