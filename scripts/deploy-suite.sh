#!/bin/bash

# Production Deployment Orchestrator for Prompt App Suite
# Targets Project: heidless-apps-0

PROJECT_ID="heidless-apps-0"
APPS=("PromptTool" "PromptResources")
LOG_FILE="/home/heidless/projects/PromptAccreditation/deploy-progress.log"

# Clear log
> "$LOG_FILE"

echo "Starting deployment of Prompt App Suite to $PROJECT_ID at $(date)..." | tee -a "$LOG_FILE"

# Background reporter logic
report_status() {
  local start_time=$1
  while true; do
    sleep 60
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    echo ""
    echo "=========================================="
    echo "PRODUCTION DEPLOYMENT STATUS UPDATE"
    echo "Time: $(date +%H:%M:%S)"
    echo "Elapsed: $((elapsed / 60))m $((elapsed % 60))s"
    echo "------------------------------------------"
    echo "Current Log Tail:"
    tail -n 10 "$LOG_FILE"
    echo "=========================================="
    echo ""
  done
}

START_TIMESTAMP=$(date +%s)
report_status "$START_TIMESTAMP" &
REPORTER_PID=$!

# Ensure reporter is killed on exit
trap "kill $REPORTER_PID 2>/dev/null" EXIT

for APP in "${APPS[@]}"; do
  echo ">>> [$(date +%H:%M:%S)] Processing $APP..." | tee -a "$LOG_FILE"
  APP_PATH="/home/heidless/projects/$APP"
  
  if [ ! -d "$APP_PATH" ]; then
    echo "ERROR: Directory $APP_PATH not found." | tee -a "$LOG_FILE"
    continue
  fi
  
  cd "$APP_PATH" || continue
  
  echo "Installing dependencies for $APP..." | tee -a "$LOG_FILE"
  npm install --legacy-peer-deps --no-audit --no-fund >> "$LOG_FILE" 2>&1
  
  if [ $? -ne 0 ]; then
    echo "CRITICAL: Dependency installation failed for $APP." | tee -a "$LOG_FILE"
    continue
  fi

  echo "Building $APP..." | tee -a "$LOG_FILE"
  npm run build >> "$LOG_FILE" 2>&1
  
  if [ $? -eq 0 ]; then
    # Site mapping
    SITE=""
    case $APP in
      "PromptTool") SITE="prompttool-v0" ;;
      "PromptResources") SITE="promptresources-v0" ;;
      "PromptMasterSPA") SITE="promptmaster-v0" ;;
      "PromptAccreditation") SITE="promptaccreditation-v0" ;;
      "ag-video-system") SITE="videosystem-v0" ;;
    esac
    
    echo "Deploying $APP to site $SITE..." | tee -a "$LOG_FILE"
    # Note: Using --non-interactive for automated flow
    firebase deploy --only hosting:$SITE --project $PROJECT_ID --non-interactive >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
      echo "SUCCESS: $APP is live at https://$SITE.web.app" | tee -a "$LOG_FILE"
    else
      echo "FAILURE: $APP deployment failed. Check log for details." | tee -a "$LOG_FILE"
    fi
  else
    echo "FAILURE: $APP build failed. Check log for details." | tee -a "$LOG_FILE"
  fi
done

echo "DEPLOMENT CYCLE COMPLETE at $(date)." | tee -a "$LOG_FILE"
kill $REPORTER_PID 2>/dev/null
