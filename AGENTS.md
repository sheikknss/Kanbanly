<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Feature code is JavaScript (.js/.jsx) with allowJs; the user wants a JS learning project.
- Business data lives in Redux Toolkit (src/store/redux), UI state in Zustand (src/store/zustand), auth/theme in Context; keep each state kind in its own tool so the comparison stays teachable.
- Data persists through src/api/mockApi.js (localStorage); components never touch storage directly.
