const DISCORD_ID = "450047099288027146"; 

function initLanyard() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.op === 1) { 
            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_ID }
            }));
            
            setInterval(() => {
                ws.send(JSON.stringify({ op: 3 }));
            }, data.d.heartbeat_interval);
        }

        if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
            updateLivePresence(data.d);
        }
    };

    ws.onclose = () => setTimeout(initLanyard, 5000);
}

function updateLivePresence(presence) {
    const user = presence.discord_user;
    const kv = presence.kv; 

    // 1. تحديث العناصر الأساسية
    const statusDot = document.getElementById('status-dot');
    const nameText = document.getElementById('discord-name');
    const activityText = document.getElementById('discord-activity');
    const avatarImg = document.getElementById('discord-avatar');

    // 2. تحديث عناصر الكرت
    const cardAvatar = document.getElementById('card-avatar-img');
    const cardStatus = document.getElementById('card-status-dot');
    const cardName = document.getElementById('card-name-text');
    const cardActivityBox = document.getElementById('card-activity-box');
    const cardBanner = document.getElementById('card-banner'); 

    const colors = {
        online: '#3ba55c',
        idle: '#faa61a',
        dnd: '#ed4245',
        offline: '#747f8d'
    };

    const currentStatusColor = colors[presence.discord_status] || colors.offline;

    // الأسماء
    const globalName = user.global_name || user.username;
    if (nameText) nameText.innerText = globalName;
    if (cardName) cardName.innerText = globalName;

    // الأفاتار
    if (user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.avatar}.png?size=256`;
        if (avatarImg) avatarImg.src = avatarUrl;
        if (cardAvatar) cardAvatar.src = avatarUrl;
    }

    // البانر
    if (cardBanner) {
        if (kv && kv.banner_url) {
            cardBanner.style.backgroundImage = `url('${kv.banner_url}')`;
        } else if (user.banner) {
            const bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_ID}/${user.banner}.png?size=600`;
            cardBanner.style.backgroundImage = `url(${bannerUrl})`;
        }
    }

    if (statusDot) statusDot.style.background = currentStatusColor;
    if (cardStatus) cardStatus.style.background = currentStatusColor;

    // 3. فقاعة الحالة (Status Bubble)
    const customStatus = presence.activities.find(act => act.type === 4);
    const miniWrapper = document.querySelector('.mini-avatar-wrapper');
    
    // إزالة الفقاعة القديمة إن وجدت
    const existingBubble = document.getElementById('dynamic-status-bubble');
    if (existingBubble) existingBubble.remove();

    if (customStatus && (customStatus.state || customStatus.emoji)) {
        const bubble = document.createElement('div');
        bubble.id = 'dynamic-status-bubble';
        
        let emojiHtml = "";
        if (customStatus.emoji) {
            if (customStatus.emoji.id) {
                const ext = customStatus.emoji.animated ? 'gif' : 'png';
                emojiHtml = `<img src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${ext}" style="width: 16px; height: 16px; margin-right: 5px;">`;
            } else {
                emojiHtml = `<span style="margin-right: 5px;">${customStatus.emoji.name}</span>`;
            }
        }

        bubble.innerHTML = `${emojiHtml} <span>${customStatus.state || ""}</span>`;
        if (miniWrapper) miniWrapper.appendChild(bubble);
    }

    // 4. النشاط (Gaming / Spotify)
    const mainActivity = presence.activities.find(act => act.type !== 4);
    if (mainActivity && cardActivityBox) {
        let imageUrl = "https://i.imgur.com/6Yf6f8f.png"; 
        if (mainActivity.assets && mainActivity.assets.large_image) {
            imageUrl = mainActivity.assets.large_image.startsWith("mp:external") 
                ? mainActivity.assets.large_image.replace(/mp:external\/.*\/https\//, 'https://')
                : `https://cdn.discordapp.com/app-assets/${mainActivity.application_id}/${mainActivity.assets.large_image}.png`;
        }

        cardActivityBox.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px;">
                <img src="${imageUrl}" style="width: 40px; height: 40px; border-radius: 6px;">
                <div>
                    <p style="font-weight: bold; font-size: 0.9rem; color: white;">${mainActivity.name}</p>
                    <p style="font-size: 0.8rem; color: #b9bbbe;">${mainActivity.details || ""}</p>
                </div>
            </div>`;
        if (activityText) activityText.innerText = `Playing ${mainActivity.name}`;
    } else if (cardActivityBox) {
        cardActivityBox.innerHTML = "<p style='color: #b9bbbe;'>No current activity</p>";
        if (activityText) activityText.innerText = "No current activity";
    }
}

document.getElementById('discord-name').innerHTML = '!& <span class="brand-name">D@RK</span><span class="user-number">26</span>';

initLanyard();