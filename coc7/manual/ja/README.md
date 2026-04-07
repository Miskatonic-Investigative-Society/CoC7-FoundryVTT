# バージョン7.14 システム資料

この資料はCoC7システムの概略（作成中）であり、FVTTの操作説明に関するものではありません。

ゲームを遊ぶには、以下の内１つが必要です。

- 新クトゥルフ神話TRPG ルールブック
- 新クトゥルフ神話TRPG スタートセット
- 新クトゥルフTRPG クイックスタート・ルールブック

このシステムは新クトゥルフ神話TRPGのゲーム運用における一般的なタスクやルールを自動化します。

アクターシートのいくつかの箇所で2秒間マウスオーバーすると、ツールチップがポップアップされます。表示されるまでの時間は設定で変更できます。

このドキュメントは次の場所からも開くことができます：ゲーム設定 -> ヘルプ ドキュメント -> CoC7 システムマニュアルを閲覧

# 最近の変更点

変更点の全容についてはGithub上の[changelog](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) をご覧ください。

 - [Compendiums](compendiums.md) を使用しテキストを更新する

# ケイオシアムモジュール
- [Call of Cthulhu® - Starter Set](https://foundryvtt.com/packages/cha-coc-fvtt-en-starterset) - ３つのシナリオ（『ペーパー・チェイス／Paper Chase』、『屋根裏部屋の怪物／Edge of Darkness』、『死者のストンプ／Dead Man Stomp』）と、新クトゥルフ神話TRPGの遊び方説明を同梱しています。
- [Call of Cthulhu® - Quick-Start Rules](https://foundryvtt.com/packages/cha-coc-fvtt-en-quickstart) - 『悪霊の家／The Haunting』シナリオと新クトゥルフ神話TRPG及びFoundryVTTのビギナーズガイドを同梱しています。
- [Call of Cthulhu® - FoundryVTT - Investigator Wizard](https://foundryvtt.com/packages/call-of-cthulhu-foundryvtt-investigator-wizard) - 探索者生成ウィザードで使用できるパルプアーキタイプ、職業、初期設定、技能を同梱しています。このMODはChaosium社の承諾を受けてリリースされています。

# 以下概要セクション

もしこれが初めてなら、このページの下記の閲覧を推奨しています。

Foundry VTTはアクターやアイテムによって構成されています。このプログラムにより、ゲームシステム独自のアクターとアイテムを追加しています。いくつかのサンプルがシステムの辞典に格納されています。

- [アクター概要](#アクター概要)
- [アイテム概要](#アイテム概要)
- [設定概要](#設定概要)
- [シーンメニュー概要](#シーンメニュー概要)
- [キーボード・マウスショートカット集](#キーボード・マウスショートカット集)
- [初めての探索者作成](first_investigator.md)
- [キャラクター作成](character_creation.md)

# システムの使い方
※未訳
- [アクティブ効果／Active effects](effects.md) -アクティブ効果により、アクターの能力値、副能力値、技能を修正できます。
- [アクター・インポーター／Actor importer](actor_importer.md)
- アクター種別：キャラクター (TODO)
- アクター種別：荷物 (TODO)
- アクター種別：クリーチャー (TODO)
- アクター種別：NPC (TODO)
- Chat link creator (TODO)
- Character creation mode (TODO)
- [戦闘／Combat](combat.md) (TODO)
- Development phase (TODO)
- [アイテム種別](items.md) (TODO)
- [アイテム種別：アーキタイプ](item_archetype.md) (TODO)
- [アイテム種別：書物](item_book.md) (TODO)
- [アイテム種別：チェイス](chases.md)
- アイテム種別：アイテム (TODO)
- [アイテム種別：職業](item_occupation.md)
- [アイテム種別：初期設定](item_setup.md)
- [アイテム種別：技能](item_skill.md) (TODO)
- アイテム種別：呪文 (TODO)
- アイテム種別：状態異常 (TODO)
- アイテム種別：タレント (TODO)
- アイテム種別：武器 (TODO)
- [リンク作成ツール／Link Creation Tool](link_creation_window.md)
- [リンク／Links](links.md) (TODO)
- マクロ／Macros (TODO)
- ロール／Rolls (TODO)
- [正気度／Sanity](sanity.md) (TODO)
- 休息をはじめる／Start Rest (TODO)
- XP Gain (TODO)

# アクター概要

- _キャラクター／Character_ - 完全なキャラクターです。通常、探索者です。 [_キャラクター例_]
- _荷物／Container_ - アイテムを格納できる（インベントリ）シートです。 [_荷物の例_]
- _クリーチャー／Creature_ - 簡易版キャラクターです。クリーチャー（怪物）に適しています。 [_クリーチャー例_]
- _NPC_ - 簡易版キャラクターです。NPCに適しています。 [_NPC例_]

# アイテム概要

- _アーキタイプ／Archetype_ - パルプ・クトゥルフのアーキタイプによって追加される技能群や能力値をまとめたものです。システム側で自動化されていません。 [_Example Archetype_]
- _書物／Book_ - 呪文や技能成長を格納できる、魔導書です。
- _アイテム／Item_ - 所持品を表します。
- _職業／Occupation_ - 新クトゥルフ神話TRPGにおける職業を構成する、技能や能力値群です。[_Example Occupation_]
- _初期設定／Setup_ - キャラクター、クリーチャー、NPC作成の初期設定に関するアイテムです。 [_Example Setup_]
- _技能／Skill_ - 初期値やタグが設定できる、技能です。 [_Example Skill_]
- _呪文／Spell_ - 魔法の呪文です。
- _状態／Status_ - 恐怖症もしく偏執症の状態アイテムです。 [_Example Mania_]
- _タレント／Talent_ -パルプ・クトゥルフにおける特別な能力です。システム側で自動化されていません。 [_Example Talent_]
- _武器／Weapon_ - 武器（これには素手攻撃も含まれます。）の能力を設定したアイテムです。 [_Example Weapon_]

# 設定概要

ゲーム設定タブをクリックし「ゲーム設定」ヘッダ下の⚙設定をクリックすると変更できます。

- _選択ルール／Variant/Optional Rules_ - 個別のパルプ・クトゥルフルールとオプションルールの切り替えができます
- _イニシアチブ設定／Initiative Settings_ - イニシアチブのオプションルールに関する追加設定です
- _ロール設定／Roll Settings_ - ロールのデフォルト設定を変更します
- _チャット・カード設定／Chat Cards Settings_ -チャットメッセージに関する設定です
- _シーン設定／Scene Settings_ - シーンに関する設定です
- _ゲーム・アートワーク設定／Game Artwork Settings_ - この設定により、一時停止アイコンとメッセージを変更できます
- _シート設定／Sheet Settings_ - キャラクターシートの設定やオプションCSSを変更できます
- _武器設定／Weapon Settings_ - 武器に関する設定です
- _開発者＆デバッグ設定／Developer And Debug Settings_ - こちらの設定群は、システムアップデート時にあなたのワールドに障害を引き起こすおそれがあります。テスト用ワールドでのみ使用してください。
- _ロール表設定／Roll Table Settings_ - 正気度ロールが行われた際、このシステムは狂気の発作を自動的にロールできます。正気度ロール表の例が辞典にあります。

# クトゥルフ神話TRPG シーンメニュー

このメニューにアクセスするには有効化されたシーンが必要です。シーンはシーンディレクトリで作成できます。これらのオプションはキーパーにのみ有効化されています。

- _キーパーツール／Keeper's tools_
  - _成長フェイズ／Development phase_: 有効化すると、プレイヤーは成長チェックがついた技能に対し成長ロールが行えます。
  - _探索者作成モード／Character creation mode_: 有効化すると、技能にポイントを割り振ることができます。
  - _経験獲得の可否／XP gain_: 有効化すると、技能がロール成功後にチェックされます。
  - _見せかけロールをプレイヤーに送る／Send a decoy roll to players_: クリックすると、プレイヤー側に見せかけのGM秘匿ロールが表示します。
  - _休息をとる／Start Rest_: クリックすると、選択されたキャラクターたちが休息を行い経験ロールを行います。
- _ロール！／Roll !_: 達成値、ボーナス／ペナルティ・ダイスをつけた1d100をロールします。
- _リンク作成／Create link_: プレイヤーがクリックできる、ロール・リンクを作成できます。

# キーボード・マウスショートカット集

シートにはクリックするとダイスロールが行われる要素が多く含まれています。クリック後、通常はユーザに難易度とボーナス／ペナルティダイスを指定できるプロンプトが表示されます。以下の操作でこの挙動は制御できます：

- ロール可能な要素を右クリックすると、対抗ロールとして表示できます。カードが開いている限り、右クリックで行われたロールはすべて対抗ロールとして処理されます。
- ロール可能な要素をAlt + 右クリックすると、複合ロールとして追加できます。
- ロール可能な要素をShift + 左クリックすると、難易度やボーナス／ペナルティの有無を確認せずにロールします。
- ロール可能な要素をCtrl + 左クリックすると、ロールリクエストを作成します。この操作はキーパーのみ可能です。
- 正気度をAlt + 左クリックすると、最小／最大正気度減少をプレイヤーに通知します。
