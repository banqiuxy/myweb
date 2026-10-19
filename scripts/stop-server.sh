#!/system/bin/sh
# 停止 scripts/start-server.sh 启动的本地服务器
# PID 由 start-server.sh 写入 scripts/.server.pid，
# 不再像旧版那样把某个固定 PID 写死（重启后会杀错进程）

SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
PID_FILE="$SCRIPT_DIR/.server.pid"

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE" 2>/dev/null)"
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    rm -f "$PID_FILE"
    echo '已结束服务器运行！'
    exit 0
  fi
  rm -f "$PID_FILE"
fi

echo '没有找到由 scripts/start-server.sh 启动的服务器进程。'
exit 0
