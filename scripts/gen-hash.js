// 用于生成 bcrypt 哈希密码的脚本
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('请在命令行参数中提供明文密码');
  process.exit(1);
}

const saltRounds = 10;
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('哈希生成失败:', err);
    process.exit(1);
  }
  console.log('哈希结果:', hash);
});
