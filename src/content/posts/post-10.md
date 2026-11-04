---
title: 'Nothing Phone (4a) 解锁 Bootloader 与 KernelSU Root 完整教程'
description: '记录 Nothing Phone (4a) 解锁 Bootloader、修补并刷入 init_boot 镜像，以及通过 KernelSU 获取 Root 权限的完整过程，同时介绍 Nothing OS 5.0 手动刷机与重新获取 Root 的方法。'
pubDate: 2026-11-04
author: 'refac7'
tags: ['']
recommend: false
heroImage: none
ogImage: none
heroImageAspectRatio: '16/9'
---

本文主要介绍了给 Nothing Phone (4a) 解锁 Bootloader 以及获取 Root 权限的全过程，包括系统初始设置、KernelSU 安装、Nothing OS 5.0 手动刷机及重新获取 Root 权限。

> [!WARNING]
> **刷机与 Root 操作具有一定风险，请务必在开始前仔细阅读。**
>
> 1. **数据丢失：** 解锁 Bootloader 会清除手机上的所有用户数据，包括照片、文件、应用及账号信息。请提前完成完整备份。
> 2. **设备变砖：** 刷入错误的镜像、使用不匹配的固件版本或在刷写过程中断开连接，都可能导致系统无法正常启动，严重时甚至可能造成设备变砖。
> 3. **系统更新：** 获取 Root 权限后，OTA 更新可能出现安装失败、校验异常等问题。系统升级后，原有 Root 权限也可能失效，需要重新修补并刷入对应镜像。
> 4. **保修与安全性：** 解锁 Bootloader 和获取 Root 权限可能影响设备的保修资格、系统完整性校验及部分依赖安全认证的应用正常使用。具体以购买地区的保修政策及实际故障原因判定为准。
> 5. **文件版本匹配：** 请务必确认下载的固件、`boot.img` 或 `init_boot.img` 与当前设备型号及系统版本完全对应，不要直接使用其他版本的镜像。尤其注意区分 Nothing Phone (4a) 和 Nothing Phone (4a) Pro。
> 6. **操作环境：** 刷写过程中请确保手机电量充足、USB 连接稳定，并正确安装 ADB / Fastboot 驱动及工具。
> 7. **原厂镜像备份：** 在获取 Root 权限前，请妥善保存对应系统版本的原厂 `init_boot.img`，以便出现启动异常时恢复。
>
> **请注意：** 本文仅记录笔者在 Nothing Phone (4a) 上的实际操作过程，不保证适用于所有设备、固件版本及使用环境。所有操作均由读者自行决定并承担相应风险。

![Nothing Phone (4a)](https://img.refact.cc/1793758397217-jjz1xz0176.jpg)

## 一、了解相关概念

首先我们要了解几个概念：

- **fastboot**：

  一种底层刷机协议。手机进入该模式后，可通过电脑命令行直接向手机底层分区刷写文件，是解锁和刷入 Root 的核心工具。

- **bootloader 锁**：

  手机系统的第一道安全防线。默认处于锁定状态，解锁后才能刷入第三方系统或获取 Root，但代价是**清空所有数据（请注意在开始前备份重要数据）**。解锁 Bootloader 和获取 Root 权限也可能影响设备的保修资格及部分安全认证功能。

- **KernelSU**：

  一种基于内核层的 Android Root 解决方案。它通过内核机制管理应用的 Root 权限，并支持安装各类功能模块。

## 二、解锁 Bootloader

对于 Nothing Phone 来说，我们只需要进入 fastboot 即可使用电脑的命令行解锁 bootloader，无需进行额外的操作。

在开始之前，我们建议退出 Google 账号，以降低恢复出厂设置后触发账号验证、无法完成 OOBE 初始设置的风险。

### 1. 开启开发者选项

进入设置，进入“关于本机”，进入左上角 NOTHING OS X.X 卡片的“软件信息”页面，连续点击七次版本号，输入本机密码即可进入开发者模式。

回到设置主页面，进入“系统”，进入“开发者选项”，打开“OEM 解锁”和“USB 调试”，可能需要根据提示输入密码。

### 2. 安装 ADB 和 Fastboot 工具

来到电脑，下载 [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools?hl=zh-cn)，根据提示下载对应系统的版本，并完成解压。

我使用的是 Arch Linux，在终端输入：

```bash
sudo pacman -S android-tools
```

### 3. 连接手机并验证 ADB

打开 CMD 或者终端，导航到解压完成的文件夹，用数据线将手机连接至电脑，在手机上确认允许 USB 调试，使用：

```bash
adb devices
```

查看连接到的设备，出现一串识别码，后面跟上 `device` 就算成功了。

### 4. 进入 Fastboot 并解锁

输入：

```bash
adb reboot bootloader
```

此时手机会重启并进入 fastboot 模式，再次验证连接。

输入：

```bash
fastboot devices
```

并回车。我们如果看到同样的识别码，后面跟上 `fastboot` 就算连接成功。

输入：

```bash
fastboot flashing unlock
```

解锁 bootloader，用音量键选择上下，电源键确定，确认打开 bootloader 即可。

**注意：** 确认解锁后，手机会清除所有用户数据。请耐心等待设备完成操作，不要在此过程中断开连接。

## 三、完成初始系统设置

手机重启，看到黄色提示，和一串英文是正常的，大概就是提示你 bootloader 已解锁，按下电源键停止启动之类的话，不用管。

进入系统，完成 OOBE 设置。

如果说你之前没有退出谷歌账号的话，系统可能会要求你验证此前绑定的 Google 账号。这属于 Android 的恢复出厂设置保护机制（FRP）。

可是国内没有直接连接谷歌的条件，Wi-Fi 也无法设置代理，如果你卡在这一步了，可以尝试使用电脑开启代理热点。

此处提供 Linux 版本，如为其他系统，请提供给 AI 转换。

![代理热点设置](https://img.refact.cc/1793758505163-3jkdlje3pq.jpg)

### 1. 下载脚本

```bash
sudo curl -o /usr/local/bin/lnxrouter https://raw.githubusercontent.com/garywill/linux-router/master/lnxrouter
```

### 2. 赋予权限

```bash
sudo chmod +x /usr/local/bin/lnxrouter
```

### 3. 安装依赖

```bash
sudo pacman -S bash procps-ng iproute2 dnsmasq iptables hostapd iw wireless-tools haveged
```

### 4. 确认无线网卡名称

不同 Linux 设备的无线网卡名称可能不同，不一定都是 `wlan0`。

使用以下命令查看网卡：

```bash
ip link
```

确认无线网卡名称后，以下操作中的 `wlan0` 均替换为实际名称。

### 5. 解除网卡占用

```bash
sudo nmcli device set wlan0 managed no
```

### 6. 开启热点

```bash
sudo lnxrouter --ap wlan0 MyAccessPoint -p MyPassPhrase -c 6 --freq-band 2.4
```

### 7. 配置代理并连接热点

打开你的代理软件，以 FlClash 为例，打开局域网代理和系统代理。

**这里需要特别注意：开启局域网代理和系统代理，并不意味着连接电脑热点的手机会自动使用代理。**

系统代理通常只影响运行代理软件的电脑，而局域网代理只是向其他设备开放代理服务。

如果需要让手机通过电脑的代理访问 Google 服务，还需要满足以下条件之一：

- 在手机端能够设置代理的情况下，手动填写电脑的局域网 IP 地址和 FlClash 提供的代理端口。
- 如果 OOBE 阶段无法手动设置代理，则需要额外配置电脑的透明代理或网关流量转发，让连接热点的设备流量经过代理。

因此，仅仅开启 FlClash 的局域网代理和系统代理，不能保证手机在 OOBE 阶段正常连接 Google 服务。请根据实际网络环境完成代理配置，并先验证手机能够访问所需服务。

随后连接到此热点完成后续设置即可。

完成操作后，如果不再需要热点，可以恢复 NetworkManager 对无线网卡的管理：

```bash
sudo nmcli device set wlan0 managed yes
```

## 四、获取 Root 权限

按照之前的方法，重新打开开发者选项，打开“USB 调试”。

### 1. 下载 KernelSU 和 Boot 镜像

进入桌面后，安装 **[KernelSU](https://github.com/tiann/KernelSU)**。

从 [Nothing Archive 固件页面](https://nothingarchive.tech/docs/firmware#frogger) 下载对应自己系统的 boot 镜像。

以 [Frogger-B4.1-260911-0959](https://nothingarchive.tech/docs/changelogs/frogger/Frogger-B4.1-260911-0959) 为例，下载：

[下载 Frogger-B4.1-260911-0959-image-boot.7z](https://github.com/spike0en/nothing_archive/releases/download/Frogger_B4.1-260911-0959/Frogger_B4.1-260911-0959-image-boot.7z)

解压，观察到 `init_boot.img` 文件，大小是 8MB。

**注意：** 文件大小仅供参考，不能作为镜像正确性的判断依据。请务必确认固件对应 Nothing Phone (4a)，并且与手机当前运行的系统版本一致。

### 2. 检查 KernelSU 支持状态

打开 KernelSU，检查设备的安装状态。

如果显示 `Not installed`，并且设备支持相应安装方式，可以继续进行修补。

如果显示 `Unsupported`，不要直接按照本文的方法刷入镜像，应先确认设备的内核及 KernelSU 兼容性。

### 3. 备份原厂 init_boot.img

在修补之前，请将解压得到的原厂 `init_boot.img` 单独复制一份，保存在电脑上。

建议按照系统版本命名，例如：

```text
Frogger_B4.1/
├── init_boot.img
└── init_boot_original.img
```

这样即使修补后的镜像无法正常启动，也可以通过 Fastboot 恢复原厂镜像。

### 4. 修补 Boot 镜像

打开 KernelSU，进入最上面的未安装，选择用 boot 镜像修补，选择 `init_boot.img` 进行修补。

修补后的文件会保存在原路径下，将修补后的镜像传入电脑。

注意不要覆盖之前保存的原厂镜像。

### 5. 刷入修补后的镜像

按照之前的方法将手机连接电脑，进入 ADB。

输入：

```bash
adb reboot bootloader
```

此时手机会重启并进入 fastboot 模式，再次验证连接：

```bash
fastboot devices
```

确认设备已经连接后，检查当前活动槽位：

```bash
fastboot getvar current-slot
```

记下返回的活动槽位信息，确保接下来使用的修补镜像与当前系统版本及活动槽位对应。

然后执行：

```bash
fastboot flash init_boot "/path/to/patched_init_boot.img"
```

将 `/path/to/patched_init_boot.img` 替换为电脑上实际的修补镜像路径。

![刷入修补后的镜像](https://img.refact.cc/1793758570597-xjhr3qfl3hn.jpg)

最后输入：

```bash
fastboot reboot
```

重启手机，进入 KernelSU，如果看到已激活，则 Root 成功。

![KernelSU 激活状态](https://img.refact.cc/1793758585850-hlm9bw7xbd7.jpg)

### 6. 恢复原厂 init_boot.img

如果刷入修补镜像后无法正常启动，或者需要恢复原厂启动环境，可以重新进入 Fastboot，使用此前保存的原厂镜像进行恢复。

```bash
adb reboot bootloader
```

确认设备连接：

```bash
fastboot devices
```

恢复原厂镜像：

```bash
fastboot flash init_boot "/path/to/init_boot_original.img"
```

重启设备：

```bash
fastboot reboot
```

**注意：** 恢复时必须使用与当前系统版本及活动槽位对应的原厂镜像。如果系统已经升级，不能继续使用旧版本的镜像进行恢复。

Root 完成后，建议妥善保存对应版本的原厂 `boot.img`、`init_boot.img` 以及完整固件包。

如果需要进行完整分区备份，应使用适合设备分区布局的备份工具，并确认备份内容可以正常恢复。

![全字库备份](https://img.refact.cc/1793758995042-2ch1c83oi4.jpg)

## 五、升级 Nothing OS 5.0 并重新获取 Root

在笔者 root 完成的第二天，nothing 推送了 nothing OS 5.0 更新，发现无法进行 OTA 更新，在更新页面提示安装出现问题，尝试多次仍未成功，于是笔者决定直接刷入 OS 5.0。

Root 修改了系统启动相关镜像，可能影响 OTA 更新过程中的分区校验和安装流程。不同系统版本及安装方式的具体情况有所不同。

![OTA 更新失败](https://img.refact.cc/1793758610676-6u6nde7fuic.jpg)

### 1. 下载官方固件归档

首先在电脑下载 Nothing OS 官方全量固件的第三方归档：

[Nothing Archive - Frogger C5.0-261023-2145](https://github.com/spike0en/nothing_archive/releases/tag/Frogger_C5.0-261023-2145)

（7z 分片，需在电脑解压）。

**注意：** 此处使用的是 Nothing OS 官方固件的第三方归档，并非 Nothing 官方下载站。

请确认下载的是 Frogger 对应的 Nothing Phone (4a) 固件，不要误用 FroggerPro 的固件。

### 2. 下载 Phone (4a) 专用线刷脚本

然后使用网上找到的线刷脚本：

[spike0en/nothing_flasher](https://github.com/spike0en/nothing_flasher)

该项目为不同 Nothing 手机提供了不同的刷机脚本。

Nothing Phone (4a) 应使用 Frogger 专用分支：

- [Windows 版本](https://github.com/spike0en/nothing_flasher/blob/frogger/Windows/flash_all.bat)
- [Bash / Linux 版本](https://github.com/spike0en/nothing_flasher/blob/frogger/bash/flash_all.sh)

不要使用其他机型的脚本。

### 3. 执行全量刷写

将完整解压后的固件镜像文件与对应系统的刷机脚本放在一起。

Linux 用户可以在终端进入对应目录，执行：

```bash
chmod +x flash_all.sh
bash flash_all.sh
```

Windows 用户则运行对应的 `flash_all.bat`。

确保手机已经进入 Bootloader / Fastboot 模式，并且电脑能够正常识别设备。

脚本会检查当前活动槽位，并根据设备情况进入 Fastbootd，随后执行分区刷写。

**关于数据清除：**

脚本执行过程中会询问：

```text
Wipe Data? (Y/N)
```

选择 `Y` 会清除 `userdata` 和 `metadata` 分区中的数据。

选择 `N` 则跳过这一步，但不代表一定能够保留原有用户数据。跨版本升级、分区布局变化或系统兼容性问题仍可能导致无法正常启动。

因此，无论选择哪一项，都建议提前备份重要数据。

**关于 A/B 槽位：**

Nothing Flasher 的 Frogger 专用脚本会将相关镜像刷入非活动槽位，并在完成刷写后切换活动槽位。

不要在刷写过程中断开 USB 连接，也不要在所有分区刷写完成之前手动重启设备。

如果脚本提示某个分区刷写失败，不要在不了解原因的情况下选择继续执行。

![Nothing OS 5.0](https://img.refact.cc/1793758649050-b2ibjy08iq.png)

### 4. 重新获取 Root 权限

随后成功刷入 OS 5.0。

由于全量刷机过程会重新写入原厂启动镜像，之前通过 KernelSU 修补的 `init_boot.img` 也会被覆盖，因此原有 Root 权限会失效。

进入系统后，重新开启开发者选项及 USB 调试。

从对应的 C5.0 固件中提取原厂 `init_boot.img`，使用 KernelSU 重新修补。

之后按照第四章的方法，将修补后的镜像刷入当前活动槽位对应的 `init_boot` 分区。

重启手机，进入 KernelSU，如果看到已激活，则重新获取 Root 权限成功。

## 六、特别鸣谢

感谢 [RainView](https://rainview.net/) 在技术上提供的支持和帮助。