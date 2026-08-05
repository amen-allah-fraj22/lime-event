/** Placeholder media aligned with Stitch artist profile mockups. */
const COVER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQfaos_to-nAFfTDyGFqsUyHK5hoHOSsdA8oYpOztze-PYJl68yi6g19PSHxGBFt3vkU5gdSi0lWDH4wq3LlHv4Z-hZZcqDRNyS72M91CfL-nW-fQlnuQJBzDPv4LNEIv8CoTWea8Rd1Kzu-gN3s6Rj26UopgsobzLfKRq7S1Il174nN275K0X4O4ELe9KAFlyHNtuZuStF-2hPSyKdZLoOKR53hGO9_8Lb19I7M0OFEFdRqrbfqLHG1ChjAp4PE53JwPPJCXeG6Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBtJxUFLBlCLvyVTON3YLi_dtxqxddVt7SBeXVe0gCPJMo379IEDZD643kvuXyOw5zAOgniVndJ6om0jZYi8Wgz12R9y3IklE9CENKeaLJ6l-JGhu-GKuZMlq0yQcf34c6IN9T1Kc-BojyI8Lp4E1FbBEwtfjssugIzrY2L_W-q98qp_dzK_CvbduyzlpT-oFwZmuFi_9V-q8XiFSy3vlp4DJHJvsGZ7woLOpb903tGi7gM8A2ojU8hMTlR_9kr0SIxHBYEs_3pDs',
];

const AVATAR_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAHGRREyAAyLx8cwSpf-nmEvYT6rW-Uk8qgEYh5FPie9tSX89KEr7p7twDs_bA_4gg_Q3gqvyCDS0r4J0RqowE2DdCSU3sG52jLV81rKYji4lvRToX3PxIFITQZr1Trw4u-ctGXy_96aGeSuRhQAUkdoQFtQwt7Sr9GueXVMK3yE50Cc6lnkv-lbv7gDtjk5rvaqPCZTH_aj6rcrRqAeZPVJrlusJo7ZvRWDZK8dSKkN1EP6TRwWX9CLxPogzBDijYQpBZ0T4kG3Xg',
];

const PORTFOLIO_THUMBNAILS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBtJxUFLBlCLvyVTON3YLi_dtxqxddVt7SBeXVe0gCPJMo379IEDZD643kvuXyOw5zAOgniVndJ6om0jZYi8Wgz12R9y3IklE9CENKeaLJ6l-JGhu-GKuZMlq0yQcf34c6IN9T1Kc-BojyI8Lp4E1FbBEwtfjssugIzrY2L_W-q98qp_dzK_CvbduyzlpT-oFwZmuFi_9V-q8XiFSy3vlp4DJHJvsGZ7woLOpb903tGi7gM8A2ojU8hMTlR_9kr0SIxHBYEs_3pDs',
];

function hashIndex(seed: string, length: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 2147483647;
  return h % length;
}

export function getArtistCoverUrl(artistId: string): string {
  return COVER_IMAGES[hashIndex(artistId, COVER_IMAGES.length)];
}

export function getArtistAvatarUrl(artistId: string): string {
  return AVATAR_IMAGES[hashIndex(artistId, AVATAR_IMAGES.length)];
}

export function getPortfolioThumbnailUrl(artistId: string, index: number): string {
  const pool = PORTFOLIO_THUMBNAILS;
  return pool[hashIndex(`${artistId}-${index}`, pool.length)];
}
