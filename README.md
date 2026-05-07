# Smart Plant Logger

A web application that provides remote access and control for an IoT-enabled smart plant watering system. Built as part of an Internet of Things coursework project.

## Overview

Smart Plant Logger allows users to remotely monitor plant health and manage watering schedules through a browser-based interface. The system communicates with hardware over MQTT, with a Raspberry Pi serving as the central controller for the watering pump.

## Features

- Remote monitoring of plant health metrics (soil moisture, temperature, humidity)
- Watering logs to track when and how much each plant was watered
- Manual watering button to trigger the pump on demand
- Real-time updates via MQTT messaging protocol

## Tech Stack

- **Hardware:** Raspberry Pi
- **Communication Protocol:** MQTT
- **Frontend:** HTML, CSS
- **Backend:** Node.js
- **Broker:** Mosquitto

## Architecture

The Raspberry Pi runs the watering pump and publishes sensor data (soil moisture, etc.) to an MQTT broker. The web application subscribes to these topics to display live plant health data and publishes commands back to the Pi to trigger manual watering.

## Planned Improvements

- **Multiple pump support:** Extend the system to control multiple water pumps independently, allowing coverage of a larger growing area from the same web interface.
- **Cloud deployment:** Currently hosted locally. Deploying to a cloud platform is the top priority for the next version.

## Notes

This is the original version of the project. It supports a single water pump connected to one Raspberry Pi.
