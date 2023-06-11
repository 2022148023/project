import torch
from PIL import Image
from torchvision import transforms
import sys

filename = sys.argv[1]

if len(sys.argv) != 2:
    print("Insufficient arguments")
    sys.exit()

model = torch.hub.load("huawei-noah/ghostnet", "ghostnet_1x", pretrained=True)
model.eval()

with open("./ai/imagenet_classes.txt", "r") as f:
    categories = [s.strip() for s in f.readlines()]

mappi = {
    "toilet tissue": "두루마리 휴지",
    "paper towel": "두루마리 휴지",
    "name": "물티슈",
    "basketball": "농구공",
    "soccer ball": "축구공",
    "baseball": "야구공",
    "name": "신라면 봉지",
    "television": "TV",
    "refrigerator": "냉장고",
    "name": "에어컨",
    "remote control": "리모컨",
    "mouse": "마우스",
    "name": "사과",
    "banana": "바나나",
    "pineapple": "파인애플",
    "backpack": "백팩",
    "name": "연필",
    "name": "샤프",
    "name": "볼펜",
    "digital watch": "손목 시계",
    "bath towel": "수건",
    "name": "플라스틱 배달용기",
    "dial telephone": "아이폰",
    "cellular telephone": "갤럭시 스마트폰",
    "name": "아이패드",
    "name": "갤럭시 탭",
    "name": "빨대",
    "running shoe": "신발",
    "folding chair": "의자",
    "rocking chair": "의자",
    "barber chair": "의자",
    "sweatshirt": "와이셔츠",
    "milk can": "코카콜라 캔",
    "name": "에어팟",
    "name": "아이스팩",
    "rubber eraser": "지우개",
    "comic book": "책",
    "notebook": "책",
    "laptop": "노트북",
    "prairie chicken": "치킨",
    "water bottle": "소주병",
    "beer bottle": "소주병",
    "name": "하인즈 케찹통",
    "name": "컵라면",
    "car mirror": "거울",
    "pop bottle": "페트병",
    "name": "형광등",
    "soup bowl": "도자기 그릇",
    "spotlight": "전구",
    "name": "보조배터리",
    "name": "텀블러",
    "cup": "종이컵",
    "name": "티백",
    "name": "고무장갑",
    "paintbrush": "칫솔",
    "name": "부탄가스",
    "name": "영수증",
    "packet": "우유팩",
    "name": "달걀",
}
mappii = {
    "1": "비닐류",
    "2": "스티로폼류",
    "3": "유리류",
    "4": "음식물쓰레기",
    "5": "의류 및 원단류",
    "6": "일반쓰레기",
    "7": "전자제품 및 전지류",
    "8": "종이류",
    "9": "캔류",
    "10": "플라스틱류",
    "11": "형광등",
}


input_image = Image.open("./ai/" + filename)

preprocess = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)
input_tensor = preprocess(input_image)
input_batch = input_tensor.unsqueeze(0)

if torch.cuda.is_available():
    input_batch = input_batch.to("cuda")
    model.to("cuda")

with torch.no_grad():
    output = model(input_batch)
probabilities = torch.nn.functional.softmax(output[0], dim=0)

top5_prob, top5_catid = torch.topk(probabilities, 1)

name = categories[top5_catid[0]]

try:
    cate = name.split()[-1]
    cate = mappii[cate]

    while name[-1] != " ":
        name = name[:-1]

    name = name[:-1].strip(" ")
except:
    cate = mappii["6"]

try:
    print(name)
except:
    print("None")
