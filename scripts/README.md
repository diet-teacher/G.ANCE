# 이미지 변환 스크립트 사용 안내

## 최초 1회 설치
```
npm install puppeteer
```

## 사용법
```
node scripts/convert-to-images.mjs output/시술명.html
```

예시:
```
node scripts/convert-to-images.mjs output/자연눈썹.html
```

## 결과물 위치
`output/자연눈썹-images/` 폴더에 저장됩니다.
- `full.jpg` — 전체 한 장 (미리보기용)
- `section-01.jpg`, `section-02.jpg` … — 섹션별 분할 (업로드용)
