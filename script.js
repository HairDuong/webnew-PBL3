let mqttClient;

window.addEventListener("load", (event) => {
  connectToBroker();
  
  // Thiết lập trạng thái mặc định của các nút là "Bật thiết bị"
  const buttonquat = document.querySelector("#toggle-quat");
  const buttonmaybom = document.querySelector("#toggle-maybom");
  const buttonmaybom2 = document.querySelector("#toggle-maybom2");
  const buttonden = document.querySelector("#toggle-den");
  const buttonservo = document.querySelector("#toggle-servo");
  const sendTimeBtn = document.querySelector("#send-time");
  
  buttonquat.textContent = "Bật Quạt";
  buttonmaybom.textContent = "Bật Máy Bơm 1";
  buttonmaybom2.textContent = "Bật Máy Bơm 2";
  buttonden.textContent = "Bật Đèn";
  buttonservo.textContent = "Bật Servo";

  buttonquat.classList.add("off");
  buttonmaybom.classList.add("off");
  buttonmaybom2.classList.add("off");
  buttonden.classList.add("off");
  buttonservo.classList.add("off");

  buttonquat.addEventListener("click", () => {
    toggleDevice(buttonquat, "esp32/quat/control");
  });

  buttonmaybom.addEventListener("click", () => {
    toggleDevice(buttonmaybom, "esp32/maybom/control");
  });

  buttonmaybom2.addEventListener("click", () => {
    toggleDevice(buttonmaybom2, "esp32/maybom2/control");
  });

  buttonden.addEventListener("click", () => {
    toggleDevice(buttonden, "esp32/den/control");
  });

  buttonservo.addEventListener("click", () => {
    toggleDevice(buttonservo, "esp32/servo/control");
  });

  sendTimeBtn.addEventListener("click", handleTimeSubmit);
});

function connectToBroker() {
  const clientId = "client" + Math.random().toString(36).substring(7);
  const host = 'ws://broker.emqx.io:8083/mqtt';

  const options = {
    keepalive: 60,
    clientId: clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  };

  mqttClient = mqtt.connect(host, options);

  mqttClient.on("error", (err) => {
    console.log("Error: ", err);
    mqttClient.end();
  });

  mqttClient.on("reconnect", () => {
    console.log("Reconnecting...");
  });

  mqttClient.on("connect", () => {
    console.log("Client connected: " + clientId);
    const topics = [
      "esp32/tem",
      "esp32/hum",
      "esp32/air",
      "esp32/foodrate",
      "esp32/waterrate",
      "esp32/quat/control",
      "esp32/maybom/control",
      "esp32/den/control",
      "esp32/servo/control",
      "esp32/maybom2/control",
      "esp32/fan/mode",
      "esp32/quat/test",
      "esp32/maybom1/test",
      "esp32/maybom2/test",
      "esp32/den/test",
      "targetHour",
      "targetMinute",
      "targetSecond",
    ];
    mqttClient.subscribe(topics, { qos: 0 }, (err, granted) => {
      if (err) {
        console.error("Subscription error:", err);
      } else {
        console.log("Subscribed to topics:", granted.map(g => g.topic));
      }
    });
  });

  mqttClient.on("message", (topic, message) => {
    const messageStr = message.toString();
    console.log("Received Message: " + messageStr + "\nOn topic: " + topic);
    
    // Cập nhật trạng thái nút bấm dựa trên topic và message
    if (topic === "esp32/quat/control") {
      updateButtonState(document.querySelector("#toggle-quat"), messageStr);
    } else if (topic === "esp32/maybom/control") {
      updateButtonState(document.querySelector("#toggle-maybom"), messageStr);
    } else if (topic === "esp32/den/control") {
      updateButtonState(document.querySelector("#toggle-den"), messageStr);
    } else if (topic === "esp32/servo/control") {
      updateButtonState(document.querySelector("#toggle-servo"), messageStr);
    } else if (topic === "esp32/maybom2/control") {
      updateButtonState(document.querySelector("#toggle-maybom2"), messageStr);
    }

    // Cập nhật giá trị bảng nhiệt độ, độ ẩm và nồng độ
    if (topic === "esp32/tem") {
      document.getElementById("temperature").textContent = messageStr + " °C";
    } else if (topic === "esp32/hum") {
      document.getElementById("humidity").textContent = messageStr + " %";
    } else if (topic === "esp32/air") {
      document.getElementById("concentration").textContent = messageStr +" ppm";
    } else if (topic === "esp32/foodrate") {
      document.getElementById("food-rate").textContent = messageStr + " %";
    } else if (topic === "esp32/waterrate") {
      document.getElementById("water-rate").textContent = messageStr +" %";
    }
    
  });
}

function handleTimeSubmit() {
  const targetHour = document.querySelector("#hour").value || "0";
  const targetMinute = document.querySelector("#minute").value || "0";
  const targetSecond = document.querySelector("#second").value || "0";

  if (mqttClient) {
    mqttClient.publish("targetHour", targetHour.toString());
    mqttClient.publish("targetMinute", targetMinute.toString());
    mqttClient.publish("targetSecond", targetSecond.toString());
    console.log(`Đã gửi thời gian: ${targetHour}:${targetMinute}:${targetSecond}`);
  }
}

function toggleDevice(button, topic) {
  let message;
  if (button.classList.contains("on")) {
    message = "OFF";
    button.classList.remove("on");
    button.classList.add("off");
    button.textContent = "Bật thiết bị";
  } else {
    message = "ON";
    button.classList.remove("off");
    button.classList.add("on");
    button.textContent = "Tắt thiết bị";
  }

  mqttClient.publish(topic, message, {
    qos: 0,
    retain: false,
  });
  console.log(`Sent ${message} command to ${topic}`);
}

function updateButtonState(button, message) {
  console.log("Updating button state: ", message);
  if (message.trim() === "ON") {
    button.classList.remove("off");
    button.classList.add("on");
    button.textContent = "Tắt thiết bị";
  } else if (message.trim() === "OFF") {
    button.classList.remove("on");
    button.classList.add("off");
    button.textContent = "Bật thiết bị";
  }
}
