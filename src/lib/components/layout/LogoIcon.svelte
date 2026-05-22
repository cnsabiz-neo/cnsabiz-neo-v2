<script lang="ts">
	let { size = 32 }: { size?: number } = $props();
	const h = $derived(size * (100 / 82));
</script>

<!--
  3D 아이소메트릭 블록 로고
  두 개의 직사각형 프리즘이 H자 형태를 이루는 구조
  색상은 와디즈 티어(#00C4C4) 계열 사용
-->
<svg
	width={size}
	height={h}
	viewBox="0 0 82 100"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- ─── 왼쪽 기둥 (Box 1, 전체 높이) ─── -->
	<!-- 위 면 -->
	<polygon points="30,23 45,31 30,38 15,31" fill="#1DE8DE"/>
	<!-- 앞 면 -->
	<polygon points="30,23 45,31 45,76 30,68" fill="#00C4C4"/>
	<!-- 오른쪽 측면 (그림자) -->
	<polygon points="45,31 30,38 30,83 45,76" fill="#009090"/>

	<!-- ─── 오른쪽 상단 블록 (Box 2, z: 2→3) ─── -->
	<!-- 위 면 -->
	<polygon points="51,34 66,41 51,49 36,41" fill="#1DE8DE"/>
	<!-- 앞 면 -->
	<polygon points="51,34 66,41 66,56 51,49" fill="#00C4C4"/>
	<!-- 오른쪽 측면 (그림자) -->
	<polygon points="66,41 51,49 51,64 66,56" fill="#009090"/>

	<!-- ─── 오른쪽 하단 블록 (Box 3, z: 0→1) ─── -->
	<!-- 위 면 -->
	<polygon points="51,64 66,71 51,79 36,71" fill="#1DE8DE"/>
	<!-- 앞 면 -->
	<polygon points="51,64 66,71 66,86 51,79" fill="#00C4C4"/>
	<!-- 오른쪽 측면 (그림자) -->
	<polygon points="66,71 51,79 51,94 66,86" fill="#009090"/>
</svg>
