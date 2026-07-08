name: Purge jsDelivr CDN Cache
on:
  push:
    branches:
      - main
    paths:
      - 'styles/khmerVocabularyStyles.css'
      - 'scripts/khmerVocabularyScripts.js'
jobs:
  purge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Get changed files
        id: changes
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD)
          echo "changed<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
      
      - name: Check CSS changes
        id: css
        run: echo "changed=$(echo '${{ steps.changes.outputs.changed }}' | grep -q 'styles/khmerVocabularyStyles.css$' && echo 'true' || echo 'false')" >> $GITHUB_OUTPUT
      
      - name: Check JS changes
        id: js
        run: echo "changed=$(echo '${{ steps.changes.outputs.changed }}' | grep -q 'scripts/khmerVocabularyScripts.js$' && echo 'true' || echo 'false')" >> $GITHUB_OUTPUT
      
      - name: Wait
        run: sleep 10
      
      - name: Purge CSS
        if: steps.css.outputs.changed == 'true'
        run: |
          RESPONSE=$(curl -w "\n%{http_code}" -s "https://purge.jsdelivr.net/gh/${{ github.repository }}@${{ github.ref_name }}/styles/khmerVocabularyStyles.css")
          HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "CSS purge failed with HTTP $HTTP_CODE"
            exit 1
          fi
      
      - name: Purge JS
        if: steps.js.outputs.changed == 'true'
        run: |
          RESPONSE=$(curl -w "\n%{http_code}" -s "https://purge.jsdelivr.net/gh/${{ github.repository }}@${{ github.ref_name }}/scripts/khmerVocabularyScripts.js")
          HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "JS purge failed with HTTP $HTTP_CODE"
            exit 1
          fi
