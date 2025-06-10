# Selected Prop Drillings to refactor from dataset
This markdown document provides the Prop Drillings per project that we selected to refactor.

1. Project Fitness (CHECK)
```bash
- [Home(bodyPart), SearchExercises(bodyPart), HorizontalScrollbar(bodyPart (drilled only)), BodyPart] Refactoring with Context
- [Home(setBodyPart), SearchExercises(setBodyPart (drilled only)), HorizontalScrollbar(setBodyPart (drilled only)), BodyPart] Refactoring with Context
```

2. Carbon
```bash
- [Embed(theme (drilled only)), Page(theme), StylesheetLink] Refactoring with Composition
- [Embed(copyable (drilled only)), Carbon(copyable (drilled only)), WindowControls] Refactoring with Context
- [Editor(onChange (drilled only), updateWidth (drilled only)), Carbon(onChange (drilled only)), WidthHandler] Refactoring with Context
- [Editor(updateWidthConfirm (drilled only)), Carbon(onChangeComplete (drilled only)), WidthHandler] Refactoring with Context
- [Index(enableHeroText (drilled only)), Page(enableHeroText (drilled only)), Header] (Context) (Component Composition) Refactoring with Composition
```

3. React Redux realworld example (CHECK)
```bash
- [Article(article (drilled only)), ArticleMeta(article), ArticleActions] Refactoring with Composition
- [Article(canModify (drilled only)), ArticleMeta(canModify (drilled only)), ArticleActions] Refactoring with Composition
```

4. React Proto (CHECK)
```bash
- [MainContainer(draggable (drilled only)), KonvaStage(draggable (drilled only)), Rectangle] Refactoring with Context
- [MainContainer(handleTransform (drilled only)), KonvaStage(handleTransform (drilled only)), Rectangle] Refactoring with Context
```

5. Ecommerce React (CHECK)
```bash
- [Basket(product), BasketItem(product), BasketItemControl] Refactoring with Context
- [OrderSummary(product), BasketItem(product), BasketItemControl] Refactoring with Context
```

6. Whisper (CHECK)
```bash
-[Chat(setMessage), MessageInput(onEmojiPick (drilled only)), EmojiPicker] Refactoring with Context
```

7. Prometheus (CHECK)
```bash
- [Panel(data (drilled only)), GraphTabContent(data), Graph] Refactoring with Context
- [Panel(stacked (drilled only)), GraphTabContent(stacked (drilled only)), Graph] Refactoring with Context
- [Panel(lastQueryParams (drilled only)), GraphTabContent(queryParams (drilled only)), Graph] Refactoring with Context
```

8. TiDB (CHECK)
```bash
- [App(paused (drilled only)), TitleBar(paused (drilled only)), PauseButton] Refactoring with Composition
- [App(onTogglePaused (drilled only)), TitleBar(onTogglePaused (drilled only)), PauseButton] Refactoring with Composition
```

9. MiTM Proxy
```bash
- [Response(flow (drilled only)), ContentViewOptions(flow (drilled only)), DownloadContentButton] Refactoring with Context
- [Response(message (drilled only)), ContentViewOptions(message), DownloadContentButton] Refactoring with Context
- [Request(flow (drilled only)), ContentViewOptions(flow (drilled only)), DownloadContentButton] Refactoring with Context
- [Request(message (drilled only)), ContentViewOptions(message), DownloadContentButton] Refactoring with Context
```

10. Joplin
```bash
- [MainScreenComponent(style (drilled only)), NoteEditor(style), MultiNoteActions] Refactoring with Context
- [ConfigScreenComponent(theme (drilled only)), ConfigMenuBar(theme (drilled only)), ConfigMenuBarButton] Refactoring with Context
```

11. Conky (CHECK)
```bash
- [Layout(setDarkMode), Header(setDarkMode (drilled only)), ThemeSwitcher] Refactoring with Composition
```

12. Vitess
```bash
- [Workflow(clusterID), WorkflowStreams(clusterID (drilled only)), WorkflowStreamsLagChart] Refactoring with Context
- [Workflow(keyspace), WorkflowStreams(keyspace (drilled only)), WorkflowStreamsLagChart] Refactoring with Context
- [Workflow(name), WorkflowStreams(workflowName (drilled only)), WorkflowStreamsLagChart] Refactoring with Context
```

13. Lossless Cut
```bash
[App(mainFilePath), StreamsSelector(path), FileHeading] Refactoring with Context
[App(mainFileFormatData), StreamsSelector(formatData), FileHeading] Refactoring with Context
[App(mainFileChapters), StreamsSelector(chapters (drilled only)), FileHeading] Refactoring with Context
[App(onExtractAllStreamsPress), StreamsSelector(onExtractAllStreamsPress (drilled only)), FileHeading] Refactoring with Context
```

14. Apache Superset
```bash
- [ChartCard(loading (drilled only)), ListViewCard(isLoading), ImageLoader] Refactor with Context
- [DashboardCard(loading (drilled only)), ListViewCard(isLoading), ImageLoader] Refactor with Context

- [App(isFrontendRoute (drilled only)), Menu(isFrontendRoute), RightMenu] Refactor with Context
- [PropertiesModal(onChange (drilled only)), ColorSchemeControlWrapper(onChange (drilled only)), ColorSchemeControl] Refactor with Context
- [Welcome(activeChild), ActivityTable(tab), EmptyState] Refactor with Composition

- [Welcome(showThumbnails), DashboardTable(showThumbnails), DashboardCard] Refactor with Context
- [Welcome(showThumbnails), ChartTable(showThumbnails), ChartCard] Refactor with Context
```

15. Lighthouse
```bash
- [SummaryNavigationHeader(mode (drilled only)), FlowSegment(mode), FlowStepIcon] Refactoring with Context
- [SummaryFlowStep(mode), FlowSegment(mode), FlowStepIcon] Refactoring with Context
```