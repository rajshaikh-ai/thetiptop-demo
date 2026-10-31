// Photo credits for the sample dish photos in public/dishes/.
// All are openly licensed for commercial use (CC0, CC BY or CC BY-SA) from
// Wikimedia Commons, cropped to 800x600. CC BY / BY-SA require this attribution.

export type PhotoCredit = { title: string; author: string; license: string; page: string };

export const DISH_PHOTOS: Record<string, PhotoCredit> = {
  'chicken-dum-biryani': {"title": "Chicken Hyderabadi Biryani.JPG", "author": "Dheerajk88", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Chicken_Hyderabadi_Biryani.JPG"},
  'fry-chicken-biryani': {"title": "ꯌꯦꯟ ꯆꯥꯛ ꯑꯉꯧꯕ (ꯐ꯭ꯔꯥꯏꯗ ꯆꯤꯀꯟ ꯕꯤꯔꯌꯥꯅꯤ ꯔꯥꯏꯁ) + ꯇꯤꯜꯂꯧ (ꯇꯤꯜꯍꯧ).jpg", "author": "Haoreima", "license": "CC BY 4.0", "page": "https://commons.wikimedia.org/wiki/File:%EA%AF%8C%EA%AF%A6%EA%AF%9F_%EA%AF%86%EA%AF%A5%EA%AF%9B_%EA%AF%91%EA%AF%89%EA%AF%A7%EA%AF%95_(%EA%AF%90%EA%AF%AD%EA%AF%94%EA%AF%A5%EA%AF%8F%EA%AF%97_%EA%AF%86%EA%AF%A4%EA%AF%80%EA%AF%9F_%EA%AF%95%EA%AF%A4%EA%AF%94%EA%AF%8C%EA%AF%A5%EA%AF%85%EA%AF%A4_%EA%AF%94%EA%AF%A5%EA%AF%8F%EA%AF%81)_%2B_%EA%AF%87%EA%AF%A4%EA%AF%9C%EA%AF%82%EA%AF%A7_(%EA%AF%87%EA%AF%A4%EA%AF%9C%EA%AF%8D%EA%AF%A7).jpg"},
  'egg-biryani': {"title": "Egg Biryani and Chicken Chap.jpg", "author": "Meghattay Saha", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Egg_Biryani_and_Chicken_Chap.jpg"},
  'veg-biryani': {"title": "Vegetable Biryani IMG 001.jpg", "author": "Phadke09", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Vegetable_Biryani_IMG_001.jpg"},
  'butter-chicken': {"title": "Chicken makhani.jpg", "author": "stu_spivack", "license": "CC BY-SA 2.0", "page": "https://commons.wikimedia.org/wiki/File:Chicken_makhani.jpg"},
  'butter-chicken-masala': {"title": "Chicken Tikka Masala @ Indian's Food @ Annecy (38894403364).jpg", "author": "Guilhem Vellut from Annecy, France", "license": "CC BY 2.0", "page": "https://commons.wikimedia.org/wiki/File:Chicken_Tikka_Masala_@_Indian%27s_Food_@_Annecy_(38894403364).jpg"},
  'kadhai-chicken': {"title": "Kadai Chicken-NCR.jpg", "author": "AugustineKajur", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Kadai_Chicken-NCR.jpg"},
  'aloo-bhujia': {"title": "Jeera-aloo-foodpanda.jpg", "author": "Navias", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Jeera-aloo-foodpanda.jpg"},
  'aloo-chokha': {"title": "Home made Alu vorta (Bengali mashed potato).jpg", "author": "Sm faysal", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Home_made_Alu_vorta_(Bengali_mashed_potato).jpg"},
  'aloo-gobi': {"title": "Aloo gobi.jpg", "author": "Wikimedia Commons contributor", "license": "CC BY-SA 2.0", "page": "https://commons.wikimedia.org/wiki/File:Aloo_gobi.jpg"},
  'aloo-jeera': {"title": "Aalu Jeera 1.jpg", "author": "Gaurav Dhwaj Khadka", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Aalu_Jeera_1.jpg"},
  'bhindi-masala': {"title": "Bhindi Masala.jpg", "author": "Monali.mishra", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Bhindi_Masala.jpg"},
  'dal-makhani': {"title": "Dal Makhani..JPG", "author": "Miansari66", "license": "CC0", "page": "https://commons.wikimedia.org/wiki/File:Dal_Makhani..JPG"},
  'malai-chaap': {"title": "Soya Chaap with curry.jpg", "author": "Ravi Dwivedi", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Soya_Chaap_with_curry.jpg"},
  'masala-chaap': {"title": "Soya Masala Chops with Gravy.JPG", "author": "Mdsmds0", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Soya_Masala_Chops_with_Gravy.JPG"},
  'veg-chowmein': {"title": "Hakka Noodles.JPG", "author": "Aparna Balasubramanian", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Hakka_Noodles.JPG"},
  'chilli-paneer': {"title": "Paneer Chilli, Bengaluru (2026) 02.jpg", "author": "Gpkp", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Paneer_Chilli,_Bengaluru_(2026)_02.jpg"},
  'chilli-chicken': {"title": "Chicken Chilli 1.jpg", "author": "Gaurav Dhwaj Khadka", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Chicken_Chilli_1.jpg"},
  'tandoori-roti': {"title": "Tandoori-roti.jpg", "author": "Ravi Dwivedi", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Tandoori-roti.jpg"},
  'butter-naan': {"title": "Butter Naan 2.jpg", "author": "Ganesh Mohan T", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Butter_Naan_2.jpg"},
  'lachha-paratha': {"title": "Lachha-paratha.jpg", "author": "Sonia Goyal", "license": "CC BY-SA 2.0", "page": "https://commons.wikimedia.org/wiki/File:Lachha-paratha.jpg"},
  'jeera-rice': {"title": "Jeera Rice (only).jpg", "author": "JVRKPRASAD", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Jeera_Rice_(only).jpg"},
  'plain-rice': {"title": "Steamed rice in bowl 01.jpg", "author": "Anna Frodesiak", "license": "CC0", "page": "https://commons.wikimedia.org/wiki/File:Steamed_rice_in_bowl_01.jpg"},
  'boondi-raita': {"title": "Raita Bhojpuri Lucknow Uttar Pradesh India.jpg", "author": "Shikhagzp", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Raita_Bhojpuri_Lucknow_Uttar_Pradesh_India.jpg"},
  'mix-raita': {"title": "Vegetable Raita.jpg", "author": "Bingo2310", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Vegetable_Raita.jpg"},
  'veg-thali': {"title": "North Indian Veg Thali - Dharmatala, Kolkata - West Bengal - 20190216 133637.jpg", "author": "Ajaybiswas22", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:North_Indian_Veg_Thali_-_Dharmatala,_Kolkata_-_West_Bengal_-_20190216_133637.jpg"},
  'non-veg-thali': {"title": "Non Veg Thali - Gandhi Nagar Jammu - Jammu & Kashmir - 02.jpg", "author": "Krrisd", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_02.jpg"},
};

export function dishPhoto(id: string): string | undefined {
  return DISH_PHOTOS[id] ? `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/dishes/${id}.webp` : undefined;
}
