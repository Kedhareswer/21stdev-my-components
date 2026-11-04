"use client"

import AutomationFlowCard from "@/components/ui/automation-flow-card"

// Free Unsplash portraits, inlined as small WebP so the demo fetches nothing
// off-origin. Swap in your own URLs.
// @@IMAGES-START@@
// unsplash.com/photos/1544005313-94ddf0286df2
const MAYA = "data:image/webp;base64,UklGRvQEAABXRUJQVlA4IOgEAACQGgCdASpgAGAAPq1GnEqmJCMhuNdt+MAViUAYGpEhN1etid4/47OMscVCkGFaukBDFz5zAqPbNaZOdHRqirxtBu+l5/zqamdXhtBl1egPdI0sBJ0m1BgBltMyBb3MP0xgmd9rsbGSIagAeIUNQnkwRmsmDvdHk8CQMiCNpU3K/rS0gQcIzyI6AvWN6uzmVhCBobgA0Smo7yjg8CZirjEiXAvrkWD0oVKPA+AKY/Yw6cpfWgKSXVYE1m0RdQwaUfjOcQ6U/RXeOxpB9dQq5k7U1KkTqwiwDY1amf88wAD+9wpg4H/qjNNe1MJQTOzwCsbvxwJobxru2H9lviVcyVRrBBTw7f5FUiyni88OBlvOuBh0RoXkb9B4aGqPRgDLoUJIRpWHHlmrultRect6tn1eCUDIIem4TQlcUAS/OSIvJJMzBb+uVOJh+DL5td3zMXx05+UTXvOSkT67CF7Uk3sNZX4dFEwQ/wnGzZmZMKsO/aeJ9r+PpNIRfBjgUjFTp6846eyAeBkw1g091h2I7ytR4vWguC1jT12EQZYA+gtK/T3IMSU6jB3NOuRnvItl5Y4N4EjisNCtCZZbCFwaS13q9byyt5uqxPwC8i2I/4RvL6BEotAETs43g7uHsByF2KpUDE8XXuW0BorAeOVW9YfdsDatSVlX1bl7Oeq+i/8x2GZeU3wwx9sevd0Gpzq++XWvoXlc86TB4OCkDAkLGH+V3NkfF52WoxVlsW+XcW5r2lmgZwC7cbPQvDr+gaGUe5eIJ2bIV5OuV2gK/Mao8fV33Mp2UbE4v54fb6VVPP0LR0LEmpnnOTKtAD3yO5xnpIKSuj7F5BcRq+Dgy4oZ0lnlsY8DBGszDNqv7UIZO0Xa6WEPEv/cvWu0Dn1ZA5fX5Dw0lRlHq/90ip5pMNUoCicZZo7WWwW16UxLYSm/gHCrK/8CJbqD5fxzk24Ag2ZU3Qm7U1v7Lwh6xiRhztWBsH1iI+f2o+7wKPfgc1j5KzVbxYg2RgnLeItUGg3f2jtgxQv/ur2dJcG5pqDyK5p9BzQzr+0cXW2Xk0kJHape8IvDbQUsFCDuujnjgHzt+bpuOqkBdfd8dnaAgZNnmHh1hu5Nt9o+pBacmPqwl/5DARfTZ3n8h2DAhbSS2nqmUGYUXN9zk2l6KoPwh1xgCrNL16W597JxjDB/c7hvsOiGmlBFjVB3wfKKTRX2/8RKAP4lUlX2QSiM0P/ON0zWZNWWWk2Z7T3Nizu7hRkPTyVWr8VSw82CypGbQ1E4lHodT83LeJY/9Uxa9u4xRh7Dyz6fpEh/z8bw/1w7dmtq/sYdh+DY3/2XLPncAqkcdBObtdJFczv69fikOGjz8B/rH7lVGyaCbJXtx5n/FgjbRPKcug4oKl8TTwM4Llw3OcvVI8F97ztRJXaHbf9P0XxxnBhIBRD6tzDuy/lozqsxbSJXeTPA42GwWDPhwwBb1KUHG6TP0luUZMey7ImCzkKpcFt5j2dCp3o/jTLk2fypSa+whE9l5njce2p3mSMUDESmpgsP1rUqiBun1Keg0+dSRyp2VaC3W0Ijhnuj7l9OjDeuixvXzh3Drc6pITt4vpTUUHC0+3MDnZXnDJCstaoUBAvuYu5MSGsm+RWEO0d5S+7pJPs43KbefMch7MmKSK3Hex05WcMxWAqgmNVYAA=="
// unsplash.com/photos/1500648767791-00dcc994a43e
const LEO = "data:image/webp;base64,UklGRnIEAABXRUJQVlA4IGYEAABQGQCdASpgAGAAPsFWpU4npCOjI5gNOPAYCUAYTxOBmiKkW4/jGm0wjfp+5x5opUgDJn7Cg2S3pXGaCtwwnCxBHe1C+YPFiewmF+aghb30guU1M/2a7Lu/ExN1WR80dWSPcqsIfeLTe3Byf/Me854cvzQSCJWwAtIGoapwbrp1BlKFXHk98NpBkjUtyWIhZBrz35HmOnYPLfCFX3zD6xRFy1TD/fWb97RynzoJ0edHlO/8L2HQ0jwlED3Il7xHEYpMkZ8Z/+s8FlUXjmM4GpM226AAAP7gi9ufukK16jvVTDklrC7+MPAXJucXEC8rTSLL/Hi/PqFRZ+i2ZZRO5/z2P0QdGQHo9xbmilbrDjNYvdMdvEHQvQBOKEWsBvMh1BWc73VFahgEHpX7mFPzliAdSLMDzuaPXt4ma/voXh9V4iYx+sURRVc3tJpJ6f8/CsG2hb/wuyY5k3nB6DzwyMdquSaUJhUUfWB/FHQjKP1QPh9P8vg3QPey39nF0/Jh1fhjiHFkdcjOUfhyR3YvYYN2XhROm+aMMIfz+XaYp3QmMblb+AlWGeZdjmZBSBT6+Zy7WAVD4Z73QvwCjtG5+Sw5CTBcsChwX0d0Y85TIcdli3Ri51/SQVLBG1DNipSmlyjFW3RYR3NlLNVvp7tm7IUimD4zN5JhNfnLzXWDGb/vtSWS+6yu0l7aikQz6irEmMxOetjjagVSbxA3WAuXdBY2xg36xJHJwPCWAzB/kUDz0yWcQtT5sVYHD7tJqIJXig/HglHLbTCDAohflvE7DjggPV7AyBEazDl37flRTPUHzp4GiTHIJyY55nvchDK4FbNrGxSxK7UOCNOCX0EiX7JOGlJkzYGCwhv3UE56hC7YwknK5GlNfBpOIMWPxlTQeIk6YINke6sWmozYa0YNgt6+hAzr1FamL9EL49cc5iSt22VraMV/hubStQ3VjOsS3Jd3swgx0J7RXstg1tpABLKmwr8L96DiSH0bhgihi+h3/1bBUgk+LPDeS+HFCZkJN5CTnZ5FUIqQk0txFYiaMqAEui/5+3zpWtWo8ly0apAfFjWp3s3Z7Q5UdHXHajXHPFUdx/q/FqmhvtZZ7N3ve4HjGVzrE/dbmEvFyolbX+K0H8W5ut4zZsdodfCvuhtQuEGab3ZM8irmhRnqp6icDQjWx8+HXm5cjVAdg4+05qZsMkZvGCHd4daHFg6Efkt6NRkN7BLPUFaTzHDthnDvuJ5CMlFEf22iFJabAUpFGp9xWdV9Gv3A7ow+qnX4o7QEBoldStBHmB9/o1XGJyrSKpWGGahfgjwzYf70MC//Nog0vzGnhAI5BXbaDMNhg+CcIaE/BTEiv5awcmsC5l3KyublKZONoq8xORkMAEifeV9H5fSPcnS54rVZHzxKrPGg/WgGCTN64ZO/h1fV6Ie5KyViMsrWwrfeURQoKPFPh8o6+edAQ7cBm40nDbY78Q5VoC84C/i062QgZzWbKt8cSTRDMEQw+AAA"
// unsplash.com/photos/1524504388940-b1c1722653e1
const SARA = "data:image/webp;base64,UklGRnACAABXRUJQVlA4IGQCAAAQEQCdASpgAGAAPsFSoUunpKMhrjn6aPAYCWUAzfTNiIhSoe1JfXBC+XbNsUfXwTmvPmh46xMz+c83/9WJtLQUhvILleIMIhJBAoFv9bVldy5Uf+Sxar9i5n+8LkvLcw1seBudCz3KAVS2Zfo4BF3M2N9yIvPxWzEWzS645d+nenFRAJ/LBP1ePxtSRoy5yegAAP7zts1NPphk1j4nNoT4cNHZY1gp2SHh6PO3qwCjtVYfgBArvlFQx9uDOlAQRQHK8ESChrToS7f1qbXyLr44FNTdVFEi5V7Wsgnc1oXhlP0EGPj8C24gVRD0hM2QCQ7jOZcBKXp2eHWfiZXl6EUqWAg6XK2b4LfbXe9y/VWxm8+MUpm/n2q4mhXcsbr6QndDRrtcAO7iJNDRTf3aANCkJi5XOQUUVUjgEM7d6uBHJ8A0XP3/Ljo5EwWFVe1e0jWJnnDcqm1fDIDnxclfYXqROG9rWX20ZnuEcCgSrCarkYNuRG1KOUQInvYpX97CL+LjLy7zAoaC04nVW12m2gSHhghgpCgboSDbLPoVlKG7H/hXSu5nHzUtO4BIoG5qQiLjtew7HohenDhImmQSQ2vvlva5ATvn7aknrnA1evE5sYRI7/U90O6hjgFqgNzCDvnbzGDUg6VBc+WxWVJt4GpqBoHYWVlsTNMB5qtAGMcTv/HTmWQNknAz6sJTXARZs1lPQrHAY3NFJEG5ve/jTZQdvdS7LbjfXuq0nRORVlHdRjpfmHM3pPYU8x8X0gU3etPR2VHq86otfd4/J60z9fUoreoFU0FIZgtA3fdkXAgRGsrpAAA="
// unsplash.com/photos/1506794778202-cad84cf45f1d
const OWEN = "data:image/webp;base64,UklGRuYDAABXRUJQVlA4INoDAABQFgCdASpgAGAAPrlOn0qnJKKhsPedoOAXCWU7h6FC8xqyk1awP7BTrp/scrdvcAaJcM3tasXuet2Z14QDLytPOAdIpub5uEGaBOebz6lrr7Pllc/Bq4tmi0gsaogxvtVqEGCXT2Ldv28IDvk20zTBz2tw7k1KHDUhKmy4hJZHA+xfrC+WrHjWNzW5GnkKXmJ9uoS/LbL1kQStzx3Gw4PNG3ZFFo1hQXpk9qT5/qhyJWiKS6SS87yp+Y4AAP76MfX1R6pYVcZAQtBIghcD030nvCJuvguPEXyKVHx9WjPxUt0PEz+dsZ9UUJoFoBVff1O5Hepg7UPBHn8mlMSWmOVfJNp19FsPckY5Nlxe8rTh84QGhVL0eGSFXTA/EKmnjJA8EnSrpd6FGhKGU4LqmNdu9+tRrR2fabgVB01Xh/bxgBi8pconIH7AaEavexWhi1QlahY4IxAeUJQS2Z427Iem6CaNPHA/eaGUrtD5Ili7teYaYmuLmRTyGOewBKN9fGeabAsl1qxDF+6BkYlujN7B3kfBD6QfKq+4KsHY2FUBm8TCMRYKy8fSgqq1B21Zvuzc51cYaygslBjNmMGhgHGzkvD5Q4b5RdVH6Fwa9Q4Ei/TYEoc4BwzYb4g/dYc7/DMsKq7Zvc61dJknk6O1NFcK4dQ6elFnENV8F9b1oK4/rtj2b50jywg1Dd4WiPymKXvsUG0Vet/qD6CF0Y9CABmGwBDDk9FvTmOglQhMB1e6vkN8KLt7pS4m+E3cF83xXEmkgv1knoBIh42ja7kfoMgK01TVzHfQDBg2a/lRwG5/85XpTZoD9zjR7l5sf7BfWUtl5fZ8TWMDf1Hhgoijiol5jPbohAeyPw0j4V0M2IKhQALhFAoI2mmYJQgEQ/IGT6hFnSAzr+/is2ScxaBzDagC9plx62KvTcpvWszgr++HNB5FN/kitzmbM4FqSIGoSdTLvoviWwy9JiKhs6zqvnXc7axObwPucOufK2CeADtPXj56eKsxst6LiyW188QAmrQ+8s+qv6kEY8oQHKHgeaQLtQSCT8++S71depA2QjoTW2FAYxxUHiHsGcU6a6Y0wFSx6NnhzbuJyP4Y6SbtT/jQT0n4oXeXVu0ssmu+uG3ZDpebJm0JfGKAWLeqqW2ZQB4BzlFMkZIi866HIcky5R4kFf0APdPsmYLexOzMSHtdsrpkbIHctmHGCLvW7EectgskdSr6G2GiUx7WyhfTWCoANXZzHB05XS7Fjhb4M7gaOcJiOlSQ6mMCMn7V57Ge1+v0sWUJjlvVXDTnhr72jYg5GLG0Fv3ihjZIAA=="
// @@IMAGES-END@@

export default function Demo() {
  return (
    <AutomationFlowCard
      title="Inbox triage assistant"
      description="Reads every new support email, sorts it by intent and drafts a first reply for review."
      edited="Edited 5 days ago"
      steps={[
        { label: "New email", icon: "mail" },
        { label: "Classify", icon: "spark" },
        { label: "Draft reply", icon: "doc" },
        { label: "Apply label", icon: "tag" },
      ]}
      stats={[
        { label: "Runs · 7d", value: "1,284" },
        { label: "Success", value: "99.2%" },
        { label: "Avg time", value: "1.4 s" },
      ]}
      people={[
        { name: "Maya", photo: MAYA },
        { name: "Leo", photo: LEO },
        { name: "Sara", photo: SARA },
        { name: "Owen", photo: OWEN },
      ]}
      extraPeople={3}
      integrations={["mail", "spark", "chat"]}
    />
  )
}
