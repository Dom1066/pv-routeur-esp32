# Photovoltaic Router C_Lyric Version 2023 for TTGO T display

The wiki Documentation is [here in French](https://wiki.apper-solaire.org/)


Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

# Photovoltaic router

## **Safety reminder**

Before connecting the photovoltaic control board to the electrical grid, ensure compliance with local electrical safety standards:

- Use properly insulated cables to avoid short circuits.
- Install protective devices, such as circuit breakers, to prevent overloads and short circuits.
- If unsure, seek the assistance of a qualified professional for installation.
- Always use Dallas probes to monitor temperatures.

## Table of Contents

1. [History](#history)
2. [Router Principle](#router-principle)
3. [Code Upload](#code-upload)
4. [Router Operation](#router-operation)
5. [Router Connection](#router-connection)
6. [Miscellaneous Information](#miscellaneous-information)

# 01 - History <a name="history"></a> 

Welcome to the official documentation of Cyril's photovoltaic router (C\_lyric). This comprehensive resource has been designed to help you install your Photovoltaic router

It's the opensource Pv router from the French association APPER, the board is open source,   
but you can order it directly from the association and the association being recognized as being of general interest in view of French taxes, it generates a tax credit for French individuals. (60%)

I do not receive any euros from the sale of the cards and all the work of developing the cards and the software is purely voluntary.
But a little encouragement is always nice.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V3MURX2)

**The DIN format card**: is [available to order on Helloassos](https://www.helloasso.com/associations/apper/formulaires/6) (the TTGO is not provided and the appearance of the card may vary a little) and it is supplied with the DIN support.  
For European countries, shipping costs are included in the price.

[![image-1685646688128.jpg](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-06/scaled-1680-/image-1685646688128.jpg)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-06/image-1685646688128.jpg)

[Back to Top](#table-of-contents)

# 02 - Router principle <a name="router-principle"></a>

The router take the measurements and [controls the remote](https://github.com/xlyric/PV-discharge-Dimmer-AC-Dimmer-KIT-Robotdyn) or local dimmers.

Simpler than a long speech:

![](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-09/scaled-1680-/image-1695222326034.jpg)

# 03 - Code Upload  <a name="code-upload"></a>

For practical reasons, programming the router is done directly from a web page, from a compatible browser (Chrome or Edge) go to the page: [https://ota.apper-solaire.org/ota.php](https://ota.apper-solaire.org/ota.php)

**In the window that opens, select the serial port to which the TTGO is connected**

**[![image-1665674872288.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/scaled-1680-/image-1665674872288.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/image-1665674872288.png)**

Select “INSTALL PV ROUTER TTGO”

**[![image-1665674808027.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/scaled-1680-/image-1665674808027.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/image-1665674808027.png)**

Validate the installation message.

[![image-1665674840508.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/scaled-1680-/image-1665674840508.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/image-1665674840508.png)

The program is uploaded:

[![image-1665674918358.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/scaled-1680-/image-1665674918358.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-10/image-1665674918358.png)

### Wifi Configuration

There are a simple methods to connect to wifi: ( or by AP mode )

#### 1) By the serial :

Once programming is done, choose “Log &amp; console”

[![image-1678909501107.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-03/scaled-1680-/image-1678909501107.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-03/image-1678909501107.png)

[![image-1678909558863.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-03/scaled-1680-/image-1678909558863.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-03/image-1678909558863.png)

From there you can use a series of commands to configure your wifi:
( put your password first )

```
pass your_ssid_pass
ssid your_ssid

reboot
```
 
You can see directly if the wifi configuration is good

[![image-1678909726040.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-03/scaled-1680-/image-1678909726040.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-03/image-1678909726040.png)

You will be able to consult IP and the wifi power level directly on the TTGo display (top right)  
\- in yellow below -64dBm  
\- in orange below -70dBm  
\- in red below -80dBm

[Back to Top](#table-of-contents)

# 04 - web configuration <a name="router-operation"></a>

### Generality

The Photovoltaic Router is responsible for analyzing the direction of the current at the electric meter using the probe (SCT013) placed on the Phase wire.  
If the current is positive, the house consumes current from the electrical network.  
If the current is negative, the installed solar panels provide more energy than the house currently consumes.

The goal of the router is therefore to increase the power of a resistive remote load to compensate for this overproduction.

In general, this load is an energy or heat storage zone which will be necessary at a later time (hot water, mass heating, battery, EV, etc.)

We therefore maximize the self-consumption of our photovoltaic installation, and we reduce its impact on the electricity network. (and associated future costs)

### Detail of the web part.

Once the code has been uploaded via the website and the entire router assembled, it is possible to connect with your web browser to the IP which is displayed on the display of your PV router.

You can therefore consult the information reported by the PV router.

[![index.jpg](https://raw.githubusercontent.com/Dom1066/pv-routeur-esp32/refs/heads/Modifs-visuelles/img/index.jpg)

On this interface you will find a gauge with the power requested from the network (Sigma, in W), the power requested from the dimmers (in %) and the temperature (in °C) reported by the probe of the 1st dimmer if existing (or probe present locally).

For the power requested from the network there are 3 states which are configurable:

\- Stable: the PV router has stabilized consumption.

\- Injection: The PV router will gradually increase the load to stabilize consumption

\- Grid: The Pv router will reduce the load to limit the needs of the house.

On this interface, there is also an “ON/OFF Oled” button which is responsible for turning the Oled screen of the TTGO T-Display on or off.  
This can just be a delay on or off until the next button press.  
(ON/OFF or timer)  
This delay is configurable in the web configuration interface.

This button is also remote on the PV router, it is the right button of the TTGO

[![image-1648219622636.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-03/scaled-1680-/image-1648219622636.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-03/image-1648219622636.png)

### Configuration of the web part.

On the base page (Dashboard), there is a “Configuration” link which points to the /config.html page

[![image-1648219745425.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-03/scaled-1680-/image-1648219745425.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2022-03/image-1648219745425.png)

This page allows you to configure all the features of the router.

[![image-1695289940033.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-09/scaled-1680-/image-1695289940033.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-09/image-1695289940033.png)

[Back to Top](#table-of-contents)

# 05 - Router operation <a name="router-connection"></a>


# Router connection

#### Safety Reminder:

Before connecting the photovoltaic control board to the electrical grid, ensure compliance with local electrical safety standards:

- Use properly insulated cables to avoid short circuits.
- Install protective devices, such as circuit breakers, to prevent overloads and short circuits.
- If unsure, seek the assistance of a qualified professional for installation.
- Always use Dallas probes to monitor temperatures.

#### Schematic diagram :

Diagram made by Titi.

[![image-1695292302393.png](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-09/scaled-1680-/image-1695292302393.png)](https://pvrouteur.apper-solaire.org/uploads/images/gallery/2023-09/image-1695292302393.png)

The card has its own protection against overloads (.15A glass fuse or automatic), but it is recommended to place it behind a circuit breaker (2A)

#### Simple installation:

As part of the installation of the Router card without a dimmer installed, all you have to do is install the card in the electrical panel and connect the SCT013 probe to the jack provided for this purpose.  
The probe must be at the output phase of your electric meter (between the Linky and the panel).

#### Installation with Dimmer:

As part of the installation of the Router card with dimmer,  
In addition to installing the SCT013 probe as previously, you must connect the Dimmer Robotdyn to the location provided on the card.  
The ball will connect to it.  
A Dallas 18B20 probe is strongly recommended to avoid any overheating of the tank.

It is also strongly recommended to connect the Robotdyn power supply downstream of the tank electronics to have double temperature security. This allows the power to be cut off in the event of a temperature rise.  
The fault of this type of configuration is that in return it is no longer possible to exceed the max setpoint of the tank set on the original heat tank card.

#### Recommendation Appendices:

The regulation of the tank by the dimmers (SSR or Robotdyn) is done by chopping the current, this causes disturbances on the electrical network. It is therefore very strongly recommended on soapstone balloons to only use one of the resistors present, which is more than sufficient. The regulation will be finer and will cause fewer disturbances.

The values ​​announced in terms of admissible amperage on the dimmers are fanciful. Connecting too high a load can also lead to excessive heating of the regulation part of the dimmer (tryac) and no longer be controllable by the control part. It is therefore advisable either to limit the power connected to it or to ventilate the radiator to increase heat dissipation. (the more resistant SSRs are a little less impacted than the Robotdyn dimmers)  
This is why I recommend taking the largest Robotdyn dimmer (20A) or SSR Random 40A minimum.

[Back to Top](#table-of-contents)
# 06 - Miscellaneous information <a name="miscellaneous-information"></a>

The router is compatible with MQTT, HA, Jeedom and domoticz.  
It can also interface with an external power calculation source such as Shelly EM

## Web API Commands

The router provides several HTTP endpoints for monitoring and control:

### Status and Monitoring
- `GET /state` - Get current device state (JSON)
- `GET /stateshort` - Get abbreviated device state (JSON)
- `GET /statefull` - Get complete device state (JSON)
- `GET /config` - Get device configuration (JSON)
- `GET /ping` - Simple connectivity test (returns "pong")

### System Control
- `ANY /reboot` - Restart the device
- `ANY /resetdallas` - Reset Dallas temperature sensor detection
- `ANY /boost` - Activate 2-hour boost mode for heating

### Configuration Management
- `ANY /get` - Main configuration endpoint with multiple parameters:
  - `?cycle=X` - Set measurement cycle time
  - `?readtime=X` - Set reading interval
  - `?cosphi=X` - Set power factor
  - `?delta=X` - Set positive power threshold
  - `?deltaneg=X` - Set negative power threshold
  - `?dimmer_power=X` - Set dimmer power level
  - `?tmax=X` - Set maximum temperature
  - `?resistance=X` - Set load resistance value
  - `?voltage=X` - Set grid voltage
  - `?offset=X` - Set measurement offset
  - `?ssid=XXXX` - Set WiFi SSID
  - `?password=XXXX` - Set WiFi password
  - `?save=1` - Save configuration to flash

### Timer/Scheduler Control
- `GET /getminuteur` - Get timer configuration:
  - `?dimmer` - Get dimmer timer
  - `?relay1` - Get relay1 timer  
  - `?relay2` - Get relay2 timer
  - `?batterie` - Get battery timer
- `ANY /setminuteur` - Set timer configuration with parameters:
  - `heure_demarrage=HH:MM` - Set start time
  - `heure_arret=HH:MM` - Set stop time
  - `temperature=X` - Set temperature threshold
  - `puissance=X` - Set power level

### Relay Control
- `?relay1=0` - Turn relay1 OFF
- `?relay1=1` - Turn relay1 ON  
- `?relay1=2` - Toggle relay1 state
- `?relay2=0` - Turn relay2 OFF
- `?relay2=1` - Turn relay2 ON
- `?relay2=2` - Toggle relay2 state

### Network and Integration
- `ANY /getwifi` - Get WiFi configuration
- `ANY /getenvoy` - Get Enphase Envoy data
- `ANY /getmqtt` - Get MQTT configuration (JSON)
- `GET /cosphi` - Get power factor measurement

### Logging and Diagnostics
- `ANY /log.txt` - Download system log file
- `ANY /cs` - Get console log output
- `ANY /getmemory` - Get task memory usage (JSON)

### Static Files
The router serves compressed web assets:
- CSS, JavaScript, fonts, and HTML files
- Configuration files (`.json`)
- Web interface pages

All configuration changes via `/get` endpoint are applied immediately and can be saved with `?save=1` parameter.

[Back to Top](#table-of-contents)