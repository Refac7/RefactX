# 环境变量加密与校验说明

## 1. 密码/Token 哈希生成

请使用如下命令生成 bcrypt 哈希：

```sh
node scripts/gen-hash.js 你的明文内容
```

## 2. .env 文件配置

将生成的哈希值填入 .env 文件对应字段。例如：

```
ADMIN_PASSWORD=$2b$10$xxxxxx
GITHUB_TOKEN=$2b$10$yyyyyy
PUBLIC_UPLOAD_TOKEN=$2b$10$zzzzzz
```

## 3. 代码校验方式

- 所有敏感校验（如密码、Token）均采用 bcrypt.compare 进行哈希比对。
- 前端/客户端提交明文，后端自动比对哈希。

## 4. 上传 Token 校验示例

如需在自定义 API 路由中校验上传 Token，可参考：

```ts
import bcrypt from 'bcryptjs';

const uploadToken = request.headers.get('Authorization')?.replace('Bearer ', '');
const HASHED_TOKEN = import.meta.env.PUBLIC_UPLOAD_TOKEN;
if (!uploadToken || !HASHED_TOKEN) {
  return new Response(JSON.stringify({ error: 'Invalid upload token' }), { status: 403 });
}
const isTokenMatch = await bcrypt.compare(uploadToken, HASHED_TOKEN);
if (!isTokenMatch) {
  return new Response(JSON.stringify({ error: 'Invalid upload token' }), { status: 403 });
}
// ...后续逻辑
```

如需批量替换其他 Token 校验方式，请联系开发者。