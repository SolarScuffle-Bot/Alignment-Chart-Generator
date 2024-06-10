const RADIAL_DISTANCES = [
	115, 196, 271, 357,
]

const SIZE_SCALES = [
	0.5, 1, 1, 1
]

function getCompression(angle) {
	const pi6 = Math.PI / 6
	return Math.cos(pi6) / Math.cos(pi6 - angle % (2 * pi6))
}

function getAngle(rx, ry) {
	return Math.atan2(ry, rx) + Math.PI
}

function getCellFromDistance(distance, angle) {
	const compression = getCompression(angle)
	const radius = distance / compression

	if (radius < RADIAL_DISTANCES[0]) {
		return 0
	} else if (radius < RADIAL_DISTANCES[1]) {
		return 1
	} else if (radius < RADIAL_DISTANCES[2]) {
		return 2
	} else if (radius < RADIAL_DISTANCES[3]) {
		return 3
	}

	return null
}

const chartImage = new Image()
chartImage.src = './images/alignment_chart.png'
let chartImageLoaded = false

const blocks = [new Image(), new Image(), new Image(), new Image()]
blocks[0].src = './images/alignment_chart_block_0.png'
blocks[1].src = './images/alignment_chart_block_1.png'
blocks[2].src = './images/alignment_chart_block_2.png'
blocks[3].src = './images/alignment_chart_block_3.png'
const blocksLoaded = [false, false, false, false]

for (let i = 0; i < 4; i++)
	blocks[i].onload = () => {
		blocksLoaded[i] = true
	}

document.addEventListener('DOMContentLoaded', () => {
    const displayCanvas = document.getElementById('display-canvas');
    const displayCtx = displayCanvas.getContext('2d');
    const displayCenterX = displayCanvas.width / 2;
    const displayCenterY = displayCanvas.height / 2;
    // const highResCanvas = document.getElementById('highres-canvas');
    // const highResCtx = highResCanvas.getContext('2d');
    // const highResCenterX = highResCanvas.width / 2;
    // const highResCenterY = highResCanvas.height / 2;

	function generateBoard(callback) {
        // Load the image and process it
		function generate() {
			chartImageLoaded = true
			// Clear the canvas
			displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            displayCtx.drawImage(chartImage, 0, 0, displayCanvas.width, displayCanvas.height);
			callback()
		}

		if (!chartImageLoaded)
			chartImage.onload = generate
		else
			generate()
    }

	generateBoard(() => {})

    function onCellHovered(row, column) {
        // console.log(`Hovered over cell ${cellIndex} in category ${categoryIndex}`);
    }

    function onCellClicked(row, column) {
		const anyOccupied = OCCUPIED[column][0] || OCCUPIED[column][1] || OCCUPIED[column][2] || OCCUPIED[column][3]
		if (anyOccupied && OCCUPIED[column][row]) {
			for (let i = 0; i < 4; i++) {
				OCCUPIED[column][i] = false
			}
		} else {
			for (let i = 0; i < 4; i++) {
				OCCUPIED[column][i] = row === i
			}
		}

		generateBoard(() => {
			for (let columnI = 0; columnI < 6; columnI++) {
				const columnRows = OCCUPIED[columnI]
				const anyOccupied = columnRows[0] || columnRows[1] || columnRows[2] || columnRows[3]
				console.log(columnRows[0], columnRows[1], columnRows[2], columnRows[3])

				if (anyOccupied) {
					for (let rowI = 0; rowI < 4; rowI++) {
						if (columnRows[rowI]) continue;
						renderCell(rowI, columnI)
					}
				}
			}
		})

    }

	function getColumnAndRow(cx, cy) {
		const rx = cx - displayCenterX
		const ry = cy - displayCenterY

		const angle = 6 * getAngle(rx, ry) / (2 * Math.PI)
		const radius = Math.hypot(rx, ry)

		const column = Math.floor(angle)
		const row = getCellFromDistance(radius, angle)
		return [column, row]
	}

	const OCCUPIED = [
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
		[false, false, false, false],
	]

	function renderCell(row, column) {
		const img = blocks[row]
		const imgLoaded = blocksLoaded[row]

		const angle = ((1 - column) % 6) * Math.PI / 3
		function render() {
			blocksLoaded[row] = true

			displayCtx.translate(displayCanvas.width / 2, displayCanvas.height / 2)
            displayCtx.rotate(-angle)
			displayCtx.drawImage(img, -displayCanvas.width / 2, -displayCanvas.height / 2, displayCanvas.width, displayCanvas.height)
			displayCtx.rotate(angle)
			displayCtx.translate(-displayCanvas.width / 2, -displayCanvas.height / 2)
		}

		if (!imgLoaded)
			img.onload = render
		else
			render()
	}

    displayCanvas.addEventListener('mousemove', (event) => {
		displayCanvas.style.cursor = 'default'

		const rect = displayCanvas.getBoundingClientRect()
		const cx = event.clientX - rect.left
		const cy = event.clientY - rect.top

		const [column, row] = getColumnAndRow(cx, cy)
		if (row === null) return

		displayCanvas.style.cursor = 'pointer'
		onCellHovered(row, column)
    });

    displayCanvas.addEventListener('click', (event) => {
        const rect = displayCanvas.getBoundingClientRect()
		const cx = event.clientX - rect.left
		const cy = event.clientY - rect.top

		const [column, row] = getColumnAndRow(cx, cy)
		if (row === null) return

		onCellClicked(row, column)
    });

	async function copyCanvasToClipboard(canvas) {
		try {
			// Convert the canvas to a data URL
			const dataUrl = canvas.toDataURL('image/png');

			// Convert the data URL to a Blob
			const response = await fetch(dataUrl);
			const blob = await response.blob();

			// Create a new ClipboardItem
			const item = new ClipboardItem({ 'image/png': blob });

			// Write the ClipboardItem to the clipboard
			await navigator.clipboard.write([item]);
			alert('Image copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy: ', err);
			alert('Failed to copy the image. Please try again.');
		}
	}

	const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    function downloadImage() {
        const link = document.createElement('a');
        link.href = displayCanvas.toDataURL('image/png');
        link.download = 'alignment_chart.png';
        link.click();
    }

	function copyImage() {
		copyCanvasToClipboard(displayCanvas)
	}

	copyBtn.addEventListener('click', copyImage)
    downloadBtn.addEventListener('click', downloadImage);
});
